# Spec — Correction des gains laveur & introduction d'une commission plateforme

**Date** : 2026-04-22
**Branche** : `feat/setup-intent-deferred-payment` (à intégrer ou fork)
**Auteur** : Claude + Leo

## Contexte

Le dashboard laveur affiche des montants incorrects. L'audit a révélé plusieurs problèmes financiers et d'intégration Stripe Connect :

1. Les cartes "Gains validés" / "Lavages réalisés" du header sont à 0 tant que le laveur n'a pas cliqué sur l'onglet Paiements (fetch déclenché uniquement sur switch de tab).
2. L'UI affiche "Commission incluse" mais aucune commission n'est déduite — le laveur reçoit 100 % du montant facturé au client.
3. `Gains validés` agrège le brut facturé (`payment.amountCents`), pas le net versé au laveur.
4. Le badge "Stripe Connect : Activé" s'allume dès la création du compte Stripe Connect, avant que l'onboarding soit terminé → risque de payout qui échoue en production.
5. `chargeCustomer` omet le paramètre `payment_method` lors du charge off-session, rendant l'acceptation potentiellement incompatible avec la conf actuelle du Customer.
6. Les paiements en statut `PARTIALLY_REFUNDED` sont ignorés de l'agrégation des gains.
7. Pas de visibilité sur les gains prévisionnels des missions en cours.

## Décisions métier

- **Commission plateforme** : 15 % du montant facturé, applicable à toute nouvelle mission.
- **Taux modifiable à chaud** : stocké en DB dans une table `PlatformSettings`, éditable via panneau admin (pas en variable d'environnement).
- **Pas de rétroaction** : les paiements historiques (où aucune commission n'a été prélevée) restent tels quels ; seul le futur est affecté.

## Architecture

### 1. Stockage du taux de commission

Nouveau modèle Prisma singleton :

```prisma
model PlatformSettings {
  id                 String   @id @default(cuid())
  commissionRate     Decimal  @db.Decimal(5, 4) @map("commission_rate")
  updatedAt          DateTime @updatedAt @map("updated_at")
  updatedByUserId    String?  @map("updated_by_user_id")
  @@map("platform_settings")
}
```

- `Decimal(5,4)` pour éviter les erreurs d'arrondi flottant et supporter jusqu'à 999,99 % (0-1 en pratique).
- Une seule ligne active (convention applicative, pas contrainte DB).
- Seed initial à `0.1500`.

### 2. Snapshot dans `Payment`

Ajout de trois colonnes nullables :

```prisma
commissionCents    Int?     @map("commission_cents")
netAmountCents     Int?     @map("net_amount_cents")
commissionRate     Decimal? @db.Decimal(5,4) @map("commission_rate")
```

Nullable → compatibilité avec les paiements pré-migration (où le laveur a touché 100 %). La lecture utilise `COALESCE(net_amount_cents, amount_cents)` pour garantir une valeur même sur ces lignes legacy.

### 3. Calcul de la commission

Nouveau module `lib/constants/commission.ts` :

```ts
export async function getCurrentCommissionRate(): Promise<Decimal>
export function computeCommission(amountCents: number, rate: Decimal): {
  commissionCents: number
  netAmountCents: number
  rateUsed: Decimal
}
```

- `commissionCents = Math.round(amountCents * rate)` (arrondi entier — la comptabilité centime se fait au niveau des transferts Stripe).
- Aucun cache en mémoire pour la v1. Si on détecte un problème de latence sur le payout, on ajoutera un cache TTL.

### 4. Modifications du flux Stripe

#### `lib/actions/payout.ts`

1. Lire le taux courant au moment du payout.
2. Calculer `{ commissionCents, netAmountCents }`.
3. Appeler `createTransfer(netAmountCents, ...)` (au lieu de `amountCents`).
4. Dans la transaction Prisma finale, updater `Payment` avec `commissionCents`, `netAmountCents`, `commissionRate`, `stripeTransferId`, `paidOutAt` — tout en une seule update atomique.

#### `lib/stripe.ts`

- `createTransfer` : aucun changement (déjà générique sur le paramètre `amountCents`).
- `chargeCustomer` (fix bug #5) : fetch des `paymentMethods` du customer avant la création du PI, passer `payment_method` explicitement. Lever une erreur métier claire si aucune carte n'est trouvée.

### 5. Endpoint `GET /api/washer/earnings`

Nouveau format de retour :

```ts
{
  validatedEarningsCents: number,
  pendingEarningsCents: number,
  upcomingEarningsCents: number,
  completedMissionsCount: number,
  totalCommissionCents: number,
  currentCommissionRate: number,
}
```

**Définitions** :
- `validatedEarningsCents` : somme de `COALESCE(netAmountCents, amountCents)` pour les paiements `SUCCEEDED` ou `PARTIALLY_REFUNDED` avec `paidOutAt != null`, moins `refundAmountCents ?? 0`.
- `pendingEarningsCents` : idem avec `paidOutAt == null` **et** booking `COMPLETED` (payout déféré).
- `upcomingEarningsCents` : estimation sur les bookings `ACCEPTED/EN_ROUTE/IN_PROGRESS` en utilisant le taux courant (recalcul à la volée car le snapshot n'existe pas encore).
- `totalCommissionCents` : somme des `commissionCents` sur tous les transferts effectués (transparence).
- `currentCommissionRate` : taux actuel en DB (pour affichage côté UI).

**Implémentation** : plusieurs `prisma.payment.aggregate` en parallèle via `Promise.all`. Pour les sommes conditionnelles sur `netAmountCents IS NULL`, deux agrégats séparés puis addition.

### 6. Endpoints `missions/available` & `missions/accepted`

- Ajout du champ `netAmountCents` dans la réponse (calculé avec le taux courant, sans snapshot).
- `finalPrice` reste = brut (pour affichage secondaire).

### 7. UI `WasherDashboardView.tsx`

**Fix bug #1** : appeler `fetchEarnings()` dans le même `useEffect` que `fetchMissions()` au mount. Supprimer la condition `activeTab === 'payments'`.

**Cartes header** :
- "Gains validés" → lit `earnings.validatedEarningsCents` (maintenant net).
- "Lavages réalisés" → inchangé.
- "Note moyenne" (vide) → remplacé par "À venir" affichant `upcomingEarningsCents`.
- "Stripe Connect" → inchangé visuellement, logique corrigée (voir §8).

**Cartes mission** :
- Prix en gros = net laveur.
- Ligne secondaire : `{brut} brut · {taux}% commission`.
- Taux lu depuis `earnings.currentCommissionRate`.

**Onglet Paiements** :
- Cartes existantes conservées.
- Nouvelle ligne discrète : "Commission plateforme prélevée à ce jour : X €".

### 8. Stripe Connect status (bug #4)

**Problème** : `stripeAccountId` est persisté dès `startStripeOnboarding`, avant la complétion de l'onboarding Stripe.

**Solution** :
1. Ajouter `stripeAccountReady: Boolean @default(false)` à `Profile`.
2. Webhook `account.updated` dans `api/webhooks/stripe/route.ts` : lire `charges_enabled && payouts_enabled && details_submitted` → update du flag.
3. Page `/washer/stripe-callback` : server component qui appelle `stripe.accounts.retrieve(id)` côté serveur, update DB, affiche état réel.
4. `WasherDashboardView` : `stripeConnected = profile.stripeAccountReady`.
5. `api/washer/missions/accept` : bloquer l'acceptation si `!profile.stripeAccountReady` (garde-fou).

### 9. Admin — modification du taux

**Endpoint `/api/admin/settings/commission`** :
- `GET` : retourne `{ commissionRate }`.
- `PATCH` : body `{ rate: number }`, validation `0 ≤ rate ≤ 1`, guard `withAdminGuard`, upsert de la ligne unique.

**Page `/admin/settings`** : form minimal, input numérique (pourcentage), soumission AJAX.

## Migrations & déploiement

1. `prisma db push` pour créer `platform_settings` + nouvelles colonnes.
2. Seed : insérer la ligne `PlatformSettings` avec `commissionRate = 0.1500`.
3. Pas de backfill sur les paiements existants (nullables).
4. Déploiement front/back en une passe — les anciens clients continuent de voir les anciens montants (net = brut car `netAmountCents IS NULL` → fallback sur `amountCents`).

## Ordre d'implémentation suggéré

1. Schema + migration + seed.
2. Helper `computeCommission` + module commission.
3. Modification `payout.ts` et `chargeCustomer`.
4. Modification endpoint earnings + endpoints missions.
5. Fix bug #1 dans le dashboard (trivial, indépendant).
6. Refonte UI cartes mission + carte "À venir".
7. Stripe Connect status (webhook + flag).
8. Admin settings page + endpoint.

## Tests

- Unitaires : `computeCommission` (arrondis aux bornes, rate = 0, rate = 1).
- Intégration Playwright : accept flow + complete flow → assertion sur snapshot `Payment` et montant transféré.
- Manuels : dashboard avec un compte laveur test, missions en différents états.

## Hors périmètre

- Historique des modifications de taux (table d'audit).
- Commissions variables par laveur / par service.
- Reporting financier multi-période.
