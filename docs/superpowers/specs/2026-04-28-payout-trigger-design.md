# Spec — Déclenchement automatique du payout laveur

**Date** : 2026-04-28
**Issue** : [#24 — Payout laveur jamais déclenché automatiquement à la fin d'une mission](https://github.com/LeoLaborie/lavage-auto/issues/24)
**Branche d'implémentation** : `fix/payout-trigger`

## Contexte

Le code actuel n'autorise qu'une seule transition `IN_PROGRESS → COMPLETED` : déclenchée par le client (ou un admin) via `POST /api/booking/[id]/complete`. Si le client n'ouvre jamais son dashboard, le booking reste en `IN_PROGRESS` indéfiniment et `triggerPayout()` n'est jamais appelé. Le laveur n'est pas payé.

État prod (2026-04-28) :

| Statut | Volume |
|---|---|
| `ACCEPTED` | 5 |
| `IN_PROGRESS` | **5** |
| `PENDING` | 4 |
| `COMPLETED` | 1 |

5 bookings sur 6 qui ont dépassé `ACCEPTED` sont bloqués en `IN_PROGRESS`. Le seul booking `COMPLETED` a en plus `stripe_payment_intent_id IS NULL` (échec silencieux du débit off-session à l'acceptation), exposant un second problème d'observabilité.

## Objectifs

1. **Permettre au laveur de déclencher la fin d'une mission** sans bloquer sur le client.
2. **Préserver une fenêtre de validation client** pour contester avant payout.
3. **Garantir un payout en délai borné** même si le client est inactif.
4. **Rendre visibles les échecs de payout** pour intervention admin.

## Non-objectifs

- Endpoint `dispute` (refund client pendant la review) — issue de suivi.
- Notifications email — issue de suivi (pas d'infra Resend dans le repo).
- UI admin pour les échecs de payout — l'API suffit pour ce PR.
- Retry automatique des payouts en échec — manuel pour ce PR.

## Vue d'ensemble

Cycle de vie :

```
PENDING → CONFIRMED → ACCEPTED → EN_ROUTE → IN_PROGRESS → AWAITING_REVIEW → COMPLETED
                                                          └─(client conteste)→ CANCELLED  (hors scope)
```

Quatre déclencheurs de transition vers `COMPLETED` :

| De → Vers | Acteur | Mécanisme |
|---|---|---|
| `IN_PROGRESS` → `AWAITING_REVIEW` | Laveur | `PATCH /api/washer/missions/[id]/status` étendu, requiert photos avant + après |
| `AWAITING_REVIEW` → `COMPLETED` | Client/Admin | `POST /api/booking/[id]/complete` (garde élargie) |
| `AWAITING_REVIEW` → `COMPLETED` | Cron | `POST /api/cron/auto-complete` toutes les heures, après 24 h |
| `IN_PROGRESS` (legacy) → `COMPLETED` | Cron | mêmes endpoint, fallback 7 jours + photo après requise |

## Modèle de données

### Modifications Prisma

**`Booking`** :

```prisma
enum BookingStatus {
  PENDING
  CONFIRMED
  ACCEPTED
  EN_ROUTE
  IN_PROGRESS
  AWAITING_REVIEW   // nouveau
  COMPLETED
  CANCELLED
}

model Booking {
  // ... existant
  awaitingReviewSince DateTime? @map("awaiting_review_since")  // nouveau
  // ... existant
}
```

**`PayoutAttempt`** (nouvelle table) :

```prisma
model PayoutAttempt {
  id           String   @id @default(cuid())
  bookingId    String   @map("booking_id")
  attemptedAt  DateTime @default(now()) @map("attempted_at")
  triggeredBy  String   @map("triggered_by")   // 'client' | 'cron' | 'admin'
  success      Boolean
  errorCode    String?  @map("error_code")     // ex: 'no_payment_intent'
  errorMessage String?  @map("error_message") @db.Text

  booking      Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([bookingId])
  @@index([success, attemptedAt])
  @@map("payout_attempts")
}
```

`Booking` reçoit la relation inverse `payoutAttempts PayoutAttempt[]`.

### Migration

Une migration Prisma `add_awaiting_review_and_payout_attempts` ajoute la valeur enum, le champ et la table. Pas d'altération de données existantes ; rétrocompatible.

## Endpoints

### Étendu — `PATCH /api/washer/missions/[bookingId]/status`

Ajoute `AWAITING_REVIEW` aux statuts acceptés.

| | Comportement |
|---|---|
| `VALID_LAVEUR_STATUSES` | `['EN_ROUTE', 'IN_PROGRESS', 'AWAITING_REVIEW']` |
| `ALLOWED_TRANSITIONS` | `{ ACCEPTED: 'EN_ROUTE', EN_ROUTE: 'IN_PROGRESS', IN_PROGRESS: 'AWAITING_REVIEW' }` |
| Garde photos | Si `newStatus === 'AWAITING_REVIEW'` et (`!beforePhotoUrl` ou `!afterPhotoUrl`) → 409 « Photos avant et après requises pour terminer la mission » |
| Update | `awaitingReviewSince = NOW()` quand on entre en `AWAITING_REVIEW`. `startedAt` n'est pas touché (déjà figé en `IN_PROGRESS`) |
| Idempotence | `updateMany WHERE id AND laveurId AND status = 'IN_PROGRESS'` ; `count === 0 ⇒ 409` |
| Feature flag | Si `process.env.WASHER_CAN_FINISH !== 'true'`, refuse la transition `→ AWAITING_REVIEW` avec 403 « Fonctionnalité indisponible » |

### Étendu — `POST /api/booking/[id]/complete`

Le garde de statut accepte désormais `IN_PROGRESS` *ou* `AWAITING_REVIEW` :

```ts
if (!['IN_PROGRESS', 'AWAITING_REVIEW'].includes(booking.status)) {
  return 409
}
```

L'appel `triggerPayout()` reçoit le contexte d'origine :

```ts
await triggerPayout(bookingId, {
  triggeredBy: isAdmin ? 'admin' : 'client',
})
```

Le reste (autorisation client/admin, transition vers `COMPLETED`) ne change pas.

### Nouveau — `POST /api/cron/auto-complete`

Authent : header `x-cron-secret` comparé à `process.env.CRON_SECRET`. Sans match → 401.

Sélection des bookings à traiter :

```sql
SELECT id FROM bookings WHERE
  -- Régime stable
  (status = 'AWAITING_REVIEW' AND awaiting_review_since < NOW() - INTERVAL '24 hours')
  OR
  -- Legacy : abandons sans transition par AWAITING_REVIEW
  (status = 'IN_PROGRESS' AND started_at < NOW() - INTERVAL '7 days' AND after_photo_url IS NOT NULL)
```

Pour chaque booking :

1. `updateMany` (idempotent) : passage en `COMPLETED`, set `completedAt = NOW()`, `validatedAt = NOW()`, garde le statut attendu dans le `WHERE`.
2. Si `count === 0` → skip (un autre run l'a déjà traité).
3. `triggerPayout(id, { triggeredBy: 'cron' })`. Try/catch par booking ; les échecs alimentent `PayoutAttempt` mais ne stoppent pas la boucle.

Réponse :

```json
{
  "processed": 7,
  "succeeded": 5,
  "failed": 2,
  "errors": [
    { "bookingId": "...", "error": "..." }
  ]
}
```

### Nouveau — `GET /api/admin/payouts/failures`

Guard admin (`withAdminGuard`).

Query : agrège `PayoutAttempt.success = false`, dernier essai par `bookingId`, joint au booking pour récupérer `status` et `paid_out_at` actuels.

```ts
{
  bookingId: string
  lastAttemptAt: Date
  errorCode: string | null
  errorMessage: string | null
  attemptCount: number
  bookingStatus: BookingStatus
  paidOut: boolean   // true si un retry manuel a finalement réussi
}[]
```

## Refactor `lib/actions/payout.ts`

Signature étendue :

```ts
triggerPayout(
  bookingId: string,
  opts: { triggeredBy: 'client' | 'cron' | 'admin' },
): Promise<PayoutResult>
```

À chaque sortie de la fonction (succès ou échec, dans un `finally`-équivalent — concrètement avant chaque `return`), insère une ligne dans `PayoutAttempt` avec :

- `bookingId`
- `triggeredBy = opts.triggeredBy`
- `success` = booléen
- `errorCode` parmi un enum applicatif : `not_found` · `wrong_status` · `no_payment` · `already_paid_out` · `no_payment_intent` · `no_laveur` · `no_stripe_account` · `unexpected_pi_status` · `no_charge_id` · `transfer_failed` · `unknown`
- `errorMessage` = message brut

Le contrat retourné (`PayoutResult`) ne change pas. Seuls les effets sont enrichis.

## Cron Supabase — `pg_cron`

Provisionnement via une migration SQL dédiée (committée dans `supabase/cron.sql` ou comme `prisma/migrations/<ts>_pg_cron_auto_complete.sql`) :

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'auto-complete-bookings',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://<APP_URL>/api/cron/auto-complete',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    timeout_milliseconds := 30000
  );
  $$
);
```

Le secret est posé dans le Vault Supabase et lu côté Next via `process.env.CRON_SECRET`. Les deux valeurs doivent être identiques.

`<APP_URL>` est figé par environnement. La migration prod hardcode l'URL prod. Pour preview/staging on dupliquera le job avec une URL différente.

Fréquence : toutes les heures pile. Délai max d'auto-completion après échéance : < 1 h. Idempotent : si un run plante, le suivant rattrape sans double payout.

## UI

### Client — `src/components/features/dashboard/MissionValidationCard.tsx`

- Garde élargi : `if (!['IN_PROGRESS', 'AWAITING_REVIEW'].includes(booking.status)) return null`
- Branche d'affichage en `AWAITING_REVIEW` :
  - Compteur « Vous avez X h pour valider ou contester » calculé depuis `awaitingReviewSince + 24h`
  - Photos avant/après affichées (toujours présentes en `AWAITING_REVIEW`)
  - Bouton « Valider la prestation » → POST `/api/booking/[id]/complete` (déjà câblé, signature inchangée côté front)
- Branche existante en `IN_PROGRESS` sans `afterPhotoUrl` (« En attente des photos du laveur ») reste inchangée pour les bookings legacy.

### Laveur — `src/components/Dashboard/WasherDashboardView.tsx`

- Bouton « Mission terminée » dans la carte de la mission, visible uniquement si `status === 'IN_PROGRESS'`.
- Désactivé tant que `beforePhotoUrl` ou `afterPhotoUrl` est null. Tooltip : « Photos avant et après requises ».
- Au clic : `PATCH /api/washer/missions/[id]/status` avec `{ status: 'AWAITING_REVIEW' }`.
- Une fois en `AWAITING_REVIEW`, la mission migre dans une section visuellement distincte « En attente de validation client », avec compteur 24 h symétrique de celui du client.

### Admin

Pas de nouveau composant pour ce PR. L'API `GET /api/admin/payouts/failures` est consommable mais sans onglet dédié.

## Variables d'environnement

À ajouter à `.env.local` (et documenter dans `CLAUDE.md`) :

```
CRON_SECRET=<openssl rand -hex 32>
WASHER_CAN_FINISH=true
```

Le `CRON_SECRET` doit aussi être posé dans Supabase Vault (clé `cron_secret`). `WASHER_CAN_FINISH` est un flag de canary : permet de déployer le code avant d'activer la transition côté laveur.

## Tests

Cohérence avec le projet : Playwright API tests, pas d'unitaires, pas de mock framework. Stripe en sandbox keys (pattern existant des tests `payout`).

### Nouveaux fichiers

**`tests/api/booking-awaiting-review.spec.ts`**

- ✅ Laveur en `IN_PROGRESS` avec photos avant + après → `AWAITING_REVIEW`, `awaitingReviewSince` posé
- ❌ Sans `afterPhotoUrl` → 409
- ❌ Sans `beforePhotoUrl` → 409
- ❌ Autre laveur → 403
- ❌ Statut courant ≠ `IN_PROGRESS` → 409
- 🔁 Double appel concurrent → un seul succès

**`tests/api/cron-auto-complete.spec.ts`**

- ❌ Sans `x-cron-secret` → 401
- ❌ Mauvais secret → 401
- ✅ `AWAITING_REVIEW` > 24h → `COMPLETED` + payout déclenché + ligne `PayoutAttempt`
- ⏭️ `AWAITING_REVIEW` < 24h → ignoré
- ✅ Legacy `IN_PROGRESS` > 7j avec `afterPhotoUrl` → `COMPLETED` + payout
- ⏭️ Legacy `IN_PROGRESS` > 7j sans `afterPhotoUrl` → ignoré
- 🔁 Deuxième passage immédiat → 0 update, 0 nouveau payout

**`tests/api/payout-attempt.spec.ts`**

- ✅ Payout réussi → 1 ligne `success=true` avec `triggeredBy` correct
- ✅ Payout échoué (laveur sans `stripeAccountId`) → 1 ligne `success=false` + `errorCode`
- ✅ `GET /api/admin/payouts/failures` agrège, retourne le dernier essai par booking, filtré sur `success=false`
- ❌ `GET /api/admin/payouts/failures` non-admin → 403

### Tests existants à étendre

**`tests/api/booking-complete.spec.ts`** :

- `AWAITING_REVIEW → COMPLETED` par client → ok
- `AWAITING_REVIEW → COMPLETED` par admin → ok
- Tests `IN_PROGRESS → COMPLETED` existants gardés (rétrocompat).

## Plan de déploiement

1. **Migration Prisma** `add_awaiting_review_and_payout_attempts`. Rétrocompatible.
2. **Déploiement code** avec `WASHER_CAN_FINISH=false`. Aucun comportement nouveau côté utilisateurs.
3. **Activation flag** `WASHER_CAN_FINISH=true` après vérification logs.
4. **Provisionnement pg_cron** via SQL Supabase (`cron.schedule(...)`).
5. **Backfill legacy** : automatique au premier run du cron (les 5 bookings actuels en `IN_PROGRESS` qui ont une photo après seront passés en `COMPLETED` ; ceux sans photo après resteront en `IN_PROGRESS` pour décision admin manuelle).

## Risques

| Risque | Garde-fou |
|---|---|
| Cron exécute deux runs en parallèle | `updateMany WHERE status = X` atomique côté Postgres ; un seul incrémente `count` |
| Endpoint cron public exposé | `x-cron-secret` 256 bits obligatoire, sinon 401 |
| `triggerPayout` plante au milieu d'un run cron | Try/catch par booking ; échecs alimentent `PayoutAttempt`, n'arrêtent pas la boucle |
| Booking annulé entre la sélection et l'update | `updateMany WHERE status = 'AWAITING_REVIEW'` re-vérifie ; `count === 0 ⇒ skip` |
| `pg_cron` désactivé sur le plan Supabase | À vérifier post-déploiement ; fallback Vercel Cron documenté en backup |
| Booking legacy auto-complété abusivement | Filtre sur `after_photo_url IS NOT NULL` + seuil 7 jours = preuve photo + délai très long |

## Fichiers concernés

Modifiés :

- `prisma/schema.prisma`
- `src/app/api/washer/missions/[bookingId]/status/route.ts`
- `src/app/api/booking/[id]/complete/route.ts`
- `src/lib/actions/payout.ts`
- `src/components/features/dashboard/MissionValidationCard.tsx`
- `src/components/Dashboard/WasherDashboardView.tsx`
- `CLAUDE.md` (variables d'env)

Nouveaux :

- `src/app/api/cron/auto-complete/route.ts`
- `src/app/api/admin/payouts/failures/route.ts`
- `supabase/cron.sql` (ou migration dédiée)
- `tests/api/booking-awaiting-review.spec.ts`
- `tests/api/cron-auto-complete.spec.ts`
- `tests/api/payout-attempt.spec.ts`
- `prisma/migrations/<ts>_add_awaiting_review_and_payout_attempts/migration.sql`

## Issues de suivi à créer

- Endpoint `POST /api/booking/[id]/dispute` — flow contestation client → refund + `CANCELLED`.
- Notifications email (Resend) pour le passage en `AWAITING_REVIEW`.
- UI admin « Échecs de payout » consommant `GET /api/admin/payouts/failures`.
- Retry automatique des payouts échoués depuis < 7 jours.
