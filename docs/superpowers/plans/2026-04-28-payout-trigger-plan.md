# Payout Trigger Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre au laveur de déclencher la fin d'une mission, ouvrir une fenêtre de validation client de 24 h, et garantir un payout dans des délais bornés via un cron Supabase. Audite chaque tentative de payout pour rendre les échecs visibles.

**Architecture:** Ajout du statut `AWAITING_REVIEW` (entre `IN_PROGRESS` et `COMPLETED`), d'une table `PayoutAttempt` pour l'audit, d'un cron `pg_cron` horaire qui auto-complète après 24 h, et de gardes-fou photo + flag de feature `WASHER_CAN_FINISH` côté laveur. Réfère au spec : `docs/superpowers/specs/2026-04-28-payout-trigger-design.md`.

**Tech Stack:** Next.js 16 (App Router), Prisma 6, PostgreSQL (Supabase), Stripe Connect, Playwright (tests API), TypeScript strict.

---

## File Structure

**Modified**
- `prisma/schema.prisma` — ajout `AWAITING_REVIEW`, `awaitingReviewSince`, modèle `PayoutAttempt`
- `src/lib/actions/payout.ts` — nouvelle signature `triggerPayout(id, opts)` + log `PayoutAttempt`
- `src/app/api/booking/[id]/complete/route.ts` — accepte `AWAITING_REVIEW`, passe `triggeredBy` à `triggerPayout`
- `src/app/api/washer/missions/[bookingId]/status/route.ts` — accepte `AWAITING_REVIEW`, garde photos, flag de feature
- `src/components/features/dashboard/MissionValidationCard.tsx` — branche `AWAITING_REVIEW` avec compteur 24 h
- `src/components/Dashboard/WasherDashboardView.tsx` — bouton « Mission terminée » avec gating photos
- `CLAUDE.md` — nouvelles variables d'env, nouveau cycle de vie booking

**Created**
- `src/app/api/cron/auto-complete/route.ts` — endpoint cron protégé par `x-cron-secret`
- `src/app/api/admin/payouts/failures/route.ts` — vue admin des échecs de payout
- `supabase/cron.sql` — provisionnement `pg_cron` (à exécuter manuellement dans le SQL editor Supabase)
- `tests/api/booking-awaiting-review.spec.ts` — tests auth + skip DB-state pour la transition laveur
- `tests/api/cron-auto-complete.spec.ts` — tests auth + skip DB-state pour le cron
- `tests/api/payout-attempt.spec.ts` — tests auth + skip DB-state pour l'endpoint admin

---

## Notes communes

- Le projet **n'utilise pas de migrations Prisma** (pas de dossier `prisma/migrations/`). Les changements de schéma s'appliquent via `npx prisma db push` (déclaratif). Pas de fichier de migration à créer.
- Le projet **n'a pas de framework de test unitaire** ; les tests Playwright `tests/api/*.spec.ts` testent via HTTP. Les tests qui nécessitent un état DB seedé suivent le pattern existant : `test.skip(...)` avec un TODO. Ne pas chercher à introduire un mock ou un seed framework dans ce PR.
- `'use server'` reste en tête de `payout.ts`. La fonction n'est testée qu'**via** les routes API qui l'appellent — pas en isolation.
- Le worktree `.worktrees/fix-payout-trigger` doit avoir un `.env.local` (à copier depuis le repo principal) pour faire tourner `prisma db push` et le dev server. Si manquant, copier `cp ../../.env.local .` depuis le worktree avant la Task 1.

---

### Task 1: Schema Prisma — `AWAITING_REVIEW`, `awaitingReviewSince`, `PayoutAttempt`

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Ajouter la valeur `AWAITING_REVIEW` à l'enum `BookingStatus`**

Localiser l'enum (lignes ~38-46) et insérer la nouvelle valeur entre `IN_PROGRESS` et `COMPLETED`:

```prisma
enum BookingStatus {
  PENDING            // Booking created, awaiting payment or confirmation
  CONFIRMED          // Payment received, waiting for laveur
  ACCEPTED           // Laveur has accepted the mission
  EN_ROUTE           // Laveur is on the way
  IN_PROGRESS        // Washing in progress
  AWAITING_REVIEW    // Washer signaled end-of-mission; client has 24h to validate or contest
  COMPLETED          // Service finished and validated by client
  CANCELLED          // Cancelled by client (>24h before) or system
}
```

- [ ] **Step 2: Ajouter le champ `awaitingReviewSince` au modèle `Booking`**

Dans `model Booking` (lignes ~117-169), ajouter le champ juste après `validatedAt` (ligne ~154) :

```prisma
  // Completion
  startedAt           DateTime? @map("started_at")
  completedAt         DateTime? @map("completed_at")
  validatedAt         DateTime? @map("validated_at")    // When client validated the job
  awaitingReviewSince DateTime? @map("awaiting_review_since")  // When laveur signaled end-of-mission
```

Et ajouter un index pour le cron (juste après `@@index([scheduledDate])`, ligne ~167) :

```prisma
  @@index([status, awaitingReviewSince])
```

- [ ] **Step 3: Ajouter la relation inverse vers `PayoutAttempt` dans `Booking`**

Dans `model Booking`, juste après `payment Payment?` (ligne ~159) :

```prisma
  payment        Payment?
  payoutAttempts PayoutAttempt[]
```

- [ ] **Step 4: Créer le modèle `PayoutAttempt`**

Ajouter à la fin du fichier `prisma/schema.prisma`, après le dernier modèle :

```prisma
/// Audit trail for triggerPayout() invocations.
/// One row per attempt, success or failure. Used by GET /api/admin/payouts/failures
/// to surface silent payout breakdowns (cf. issue #24, cause B).
model PayoutAttempt {
  id           String   @id @default(cuid())
  bookingId    String   @map("booking_id")
  attemptedAt  DateTime @default(now()) @map("attempted_at")
  triggeredBy  String   @map("triggered_by")    // 'client' | 'cron' | 'admin'
  success      Boolean
  errorCode    String?  @map("error_code")
  errorMessage String?  @map("error_message")  @db.Text

  booking      Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([bookingId])
  @@index([success, attemptedAt])
  @@map("payout_attempts")
}
```

- [ ] **Step 5: Régénérer le client Prisma et pousser le schéma**

Run:

```bash
npx prisma generate
npx prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.` Vérifier qu'aucune perte de données n'est annoncée (le push est purement additif).

- [ ] **Step 6: Vérifier que le projet compile et lint**

Run:

```bash
npm run build
```

Expected: build successful, no TypeScript errors. (Le client Prisma régénéré expose maintenant `prisma.payoutAttempt` et `BookingStatus.AWAITING_REVIEW`.)

- [ ] **Step 7: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add AWAITING_REVIEW status, awaiting_review_since field, payout_attempts table"
```

---

### Task 2: Refactor `triggerPayout` — signature + audit `PayoutAttempt`

**Files:**
- Modify: `src/lib/actions/payout.ts`
- Modify: `src/app/api/booking/[id]/complete/route.ts` (mise à jour des appelants)

- [ ] **Step 1: Mettre à jour la signature et la documentation de `triggerPayout`**

Remplacer la signature existante (`payout.ts:25`) :

```ts
export async function triggerPayout(
    bookingId: string,
    opts: { triggeredBy: 'client' | 'cron' | 'admin' }
): Promise<PayoutResult> {
```

- [ ] **Step 2: Définir la liste des codes d'erreur applicatifs**

En haut de `payout.ts`, juste après l'import existant et avant `export interface PayoutResult` :

```ts
type PayoutErrorCode =
    | 'not_found'
    | 'wrong_status'
    | 'no_payment'
    | 'already_paid_out'
    | 'no_payment_intent'
    | 'no_laveur'
    | 'no_stripe_account'
    | 'unexpected_pi_status'
    | 'no_charge_id'
    | 'transfer_failed'
    | 'unknown'

async function recordAttempt(
    bookingId: string,
    triggeredBy: 'client' | 'cron' | 'admin',
    success: boolean,
    errorCode: PayoutErrorCode | null,
    errorMessage: string | null,
): Promise<void> {
    try {
        await prisma.payoutAttempt.create({
            data: {
                bookingId,
                triggeredBy,
                success,
                errorCode,
                errorMessage,
            },
        })
    } catch (err) {
        // Audit insertion must never break the payout flow.
        console.error('[triggerPayout] Failed to record audit row:', err)
    }
}
```

- [ ] **Step 3: Faire passer chaque branche d'erreur par `recordAttempt`**

Mettre à jour chaque `return { success: false, error: ... }` du fichier. Exemple pour la branche `booking introuvable` :

Avant :

```ts
if (!booking) {
    return { success: false, error: 'Réservation introuvable' }
}
```

Après :

```ts
if (!booking) {
    await recordAttempt(bookingId, opts.triggeredBy, false, 'not_found', 'Réservation introuvable')
    return { success: false, error: 'Réservation introuvable' }
}
```

Mapper chaque branche existante au bon `PayoutErrorCode` :

| Condition (commentaire dans le code actuel) | `errorCode` |
|---|---|
| `!booking` (étape 1) | `not_found` |
| `booking.status !== 'COMPLETED'` (étape 2) | `wrong_status` |
| `!booking.payment` (étape 3) | `no_payment` |
| `booking.payment.paidOutAt !== null` (étape 4) | `already_paid_out` |
| `!booking.payment.stripePaymentIntentId` (étape 5) | `no_payment_intent` |
| `!booking.laveurId || !booking.laveur` (étape 6) | `no_laveur` |
| `!stripeAccountId` (étape 6 suite) | `no_stripe_account` |
| `pi.status` pas dans (`requires_capture`, `succeeded`) (étape 7) | `unexpected_pi_status` |
| `!chargeId` (étape 7 fin) | `no_charge_id` |
| `catch (error)` au bout du `try` global | `unknown` |

Pour la branche `transferFailed` : il n'y a pas aujourd'hui de try/catch autour de `createTransfer` ; les erreurs Stripe tombent dans le `catch` global (donc `unknown`). C'est acceptable pour ce PR — laisser tel quel.

- [ ] **Step 4: Enregistrer aussi le succès**

Juste avant le `return` de succès final (existant) :

```ts
await recordAttempt(bookingId, opts.triggeredBy, true, null, null)

return {
    success: true,
    data: { transferId: transfer.id, paidOutAt },
}
```

- [ ] **Step 5: Mettre à jour le `catch` global**

Le bloc `catch (error: any)` à la toute fin :

```ts
} catch (error: any) {
    console.error('[triggerPayout] Error:', error)
    const message = error?.message || 'Erreur lors du déclenchement du reversement'
    await recordAttempt(bookingId, opts.triggeredBy, false, 'unknown', message)
    return {
        success: false,
        error: message,
    }
}
```

- [ ] **Step 6: Mettre à jour l'unique appelant existant — `complete/route.ts`**

Dans `src/app/api/booking/[id]/complete/route.ts:99`, remplacer :

```ts
const payoutResult = await triggerPayout(bookingId)
```

par :

```ts
const payoutResult = await triggerPayout(bookingId, {
    triggeredBy: isAdmin ? 'admin' : 'client',
})
```

(`isAdmin` est déjà défini ligne 68.)

- [ ] **Step 7: Vérifier la compilation**

Run:

```bash
npm run build
```

Expected: build successful, aucune erreur TypeScript. (La signature `triggerPayout` impose maintenant l'argument `opts` ; tout autre appelant ferait échouer le build — c'est ce qu'on veut.)

- [ ] **Step 8: Commit**

```bash
git add src/lib/actions/payout.ts src/app/api/booking/[id]/complete/route.ts
git commit -m "feat(payout): record PayoutAttempt audit row on every triggerPayout invocation"
```

---

### Task 3: Étendre `POST /api/booking/[id]/complete` — accepter `AWAITING_REVIEW`

**Files:**
- Modify: `src/app/api/booking/[id]/complete/route.ts`
- Test: `tests/api/booking-complete.spec.ts` (existant, à étendre)

- [ ] **Step 1: Ajouter les tests skip pour `AWAITING_REVIEW`**

Dans `tests/api/booking-complete.spec.ts`, après le dernier `test.skip(...)` existant et avant la fermeture `})` du `describe` :

```ts
test.skip('POST /api/booking/[id]/complete returns 200 and sets status to COMPLETED for AWAITING_REVIEW booking (client validation)', async ({ request }) => {
    // TODO: Requires authenticated session as the booking client + seeded AWAITING_REVIEW booking
    // Expected:
    //   response.status === 200
    //   body.data.status === 'COMPLETED'
    void request;
});

test.skip('POST /api/booking/[id]/complete returns 200 and sets status to COMPLETED for AWAITING_REVIEW booking (admin validation)', async ({ request }) => {
    // TODO: Requires authenticated session as ADMIN + seeded AWAITING_REVIEW booking owned by another user
    void request;
});

test.skip('POST /api/booking/[id]/complete returns 409 if booking is in PENDING/CONFIRMED/ACCEPTED', async ({ request }) => {
    // TODO: Requires authenticated session + seeded booking in any state outside IN_PROGRESS|AWAITING_REVIEW
    // Expected: response.status === 409 with body.error mentioning the current and expected statuses
    void request;
});
```

- [ ] **Step 2: Run the tests to verify existing tests still pass**

Run:

```bash
npx playwright test tests/api/booking-complete.spec.ts
```

Expected: les tests existants (auth 401) passent ; les nouveaux `.skip` apparaissent comme « skipped ».

- [ ] **Step 3: Élargir la garde de statut dans le route handler**

Dans `src/app/api/booking/[id]/complete/route.ts:78`, remplacer :

```ts
if (booking.status !== 'IN_PROGRESS') {
    return NextResponse.json(
        {
            success: false,
            error: `Impossible de compléter : statut actuel ${booking.status}. Statut attendu : IN_PROGRESS.`,
        },
        { status: 409 }
    )
}
```

par :

```ts
const completableStatuses = ['IN_PROGRESS', 'AWAITING_REVIEW'] as const
if (!completableStatuses.includes(booking.status as typeof completableStatuses[number])) {
    return NextResponse.json(
        {
            success: false,
            error: `Impossible de compléter : statut actuel ${booking.status}. Statuts attendus : IN_PROGRESS ou AWAITING_REVIEW.`,
        },
        { status: 409 }
    )
}
```

- [ ] **Step 4: Run lint and build**

Run:

```bash
npm run lint && npm run build
```

Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/booking/[id]/complete/route.ts tests/api/booking-complete.spec.ts
git commit -m "feat(booking): allow /complete from AWAITING_REVIEW in addition to IN_PROGRESS"
```

---

### Task 4: Étendre `PATCH /api/washer/missions/[id]/status` — transition `IN_PROGRESS → AWAITING_REVIEW`

**Files:**
- Modify: `src/app/api/washer/missions/[bookingId]/status/route.ts`
- Test: `tests/api/booking-awaiting-review.spec.ts` (nouveau)

- [ ] **Step 1: Créer le fichier de tests avec auth + skip placeholders**

Créer `tests/api/booking-awaiting-review.spec.ts` :

```ts
import { test, expect } from '@playwright/test'

/**
 * Issue #24 — Laveur signal end-of-mission (AWAITING_REVIEW transition)
 *
 * API tests for PATCH /api/washer/missions/[id]/status with status='AWAITING_REVIEW'
 *
 * Tests requiring a seeded IN_PROGRESS booking with photo URLs are marked `.skip`
 * until a DB seeding strategy is in place (consistent with other tests/api/*.spec.ts).
 */
test.describe('Issue #24 — Laveur AWAITING_REVIEW transition', () => {
    test('PATCH /api/washer/missions/[id]/status returns 401 for unauthenticated request', async ({ request }) => {
        const response = await request.patch('/api/washer/missions/non-existent-id/status', {
            data: { status: 'AWAITING_REVIEW' },
        })
        expect(response.status()).toBe(401)
        const body = await response.json()
        expect(body.success).toBe(false)
    })

    test.skip('returns 403 if WASHER_CAN_FINISH flag is disabled', async ({ request }) => {
        // TODO: Requires authenticated washer session + flag toggled off
        // Expected: response.status === 403 with body.error mentioning « Fonctionnalité indisponible »
        void request
    })

    test.skip('returns 200 and sets awaitingReviewSince when both photos are present', async ({ request }) => {
        // TODO: Requires authenticated washer session + seeded IN_PROGRESS booking with beforePhotoUrl and afterPhotoUrl
        // Expected:
        //   response.status === 200
        //   body.data.status === 'AWAITING_REVIEW'
        //   booking.awaitingReviewSince is non-null in DB
        void request
    })

    test.skip('returns 409 if afterPhotoUrl is missing', async ({ request }) => {
        // TODO: Requires authenticated washer session + seeded IN_PROGRESS booking with beforePhotoUrl only
        // Expected: response.status === 409 with body.error mentioning « Photos avant et après requises »
        void request
    })

    test.skip('returns 409 if beforePhotoUrl is missing', async ({ request }) => {
        // TODO: Symmetric of above
        void request
    })

    test.skip('returns 403 if the laveur is not the booking owner', async ({ request }) => {
        // TODO: Requires authenticated session as a different laveur
        void request
    })

    test.skip('returns 409 if booking is not currently IN_PROGRESS', async ({ request }) => {
        // TODO: Requires authenticated washer session + seeded ACCEPTED or EN_ROUTE booking
        void request
    })

    test.skip('is idempotent under concurrent requests', async ({ request }) => {
        // TODO: Two concurrent PATCH calls — exactly one returns 200, the other 409
        void request
    })
})
```

- [ ] **Step 2: Run the new test file to verify the auth test passes**

Run:

```bash
npx playwright test tests/api/booking-awaiting-review.spec.ts
```

Expected: 1 test passes (the 401 one), 7 are skipped.

- [ ] **Step 3: Étendre `VALID_LAVEUR_STATUSES` et `ALLOWED_TRANSITIONS`**

Dans `src/app/api/washer/missions/[bookingId]/status/route.ts`, mettre à jour les constantes en haut (lignes 10-16) :

```ts
const ALLOWED_TRANSITIONS: Record<string, string> = {
    ACCEPTED: 'EN_ROUTE',
    EN_ROUTE: 'IN_PROGRESS',
    IN_PROGRESS: 'AWAITING_REVIEW',
}

const VALID_LAVEUR_STATUSES = ['EN_ROUTE', 'IN_PROGRESS', 'AWAITING_REVIEW'] as const
type ValidLaveurStatus = (typeof VALID_LAVEUR_STATUSES)[number]
```

Mettre à jour le commentaire de tête :

```ts
/**
 * Allowed state machine transitions for laveur-initiated status updates.
 * COMPLETED is intentionally excluded: it is triggered by the client via
 * POST /api/booking/[id]/complete, by the auto-complete cron, or by an admin.
 */
```

- [ ] **Step 4: Mettre à jour le message d'erreur sur le statut invalide**

Dans le même fichier, remplacer :

```ts
return NextResponse.json(
    { success: false, error: 'Statut invalide. Valeurs acceptées : EN_ROUTE, IN_PROGRESS' },
    { status: 400 }
)
```

par :

```ts
return NextResponse.json(
    { success: false, error: 'Statut invalide. Valeurs acceptées : EN_ROUTE, IN_PROGRESS, AWAITING_REVIEW' },
    { status: 400 }
)
```

- [ ] **Step 5: Ajouter le flag de feature et la garde photos pour `AWAITING_REVIEW`**

Juste après le bloc qui gère le cas `newStatus === 'COMPLETED'` (autour ligne 47-55) et avant le `if (!VALID_LAVEUR_STATUSES.includes(...))`, ajouter :

```ts
if (newStatus === 'AWAITING_REVIEW' && process.env.WASHER_CAN_FINISH !== 'true') {
    return NextResponse.json(
        {
            success: false,
            error: 'Fonctionnalité indisponible : la clôture côté laveur n\'est pas encore activée.',
        },
        { status: 403 }
    )
}
```

Puis, après le bloc qui valide la transition (`if (booking.status !== expectedCurrentStatus)`, autour ligne 89-97) et avant le `updateMany`, ajouter :

```ts
if (newStatus === 'AWAITING_REVIEW') {
    // Refetch fields needed for the photo gate. The earlier select() omitted them.
    const photos = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { beforePhotoUrl: true, afterPhotoUrl: true },
    })
    if (!photos?.beforePhotoUrl || !photos?.afterPhotoUrl) {
        return NextResponse.json(
            {
                success: false,
                error: 'Photos avant et après requises pour terminer la mission.',
            },
            { status: 409 }
        )
    }
}
```

- [ ] **Step 6: Définir `awaitingReviewSince` dans `updateData`**

Dans le même fichier, juste après le bloc qui pose `startedAt` (lignes 102-107), ajouter :

```ts
if (newStatus === 'AWAITING_REVIEW') {
    updateData.awaitingReviewSince = new Date()
}
```

- [ ] **Step 7: Inclure `awaitingReviewSince` dans la réponse**

Mettre à jour la réponse finale du handler :

```ts
return NextResponse.json({
    success: true,
    data: {
        bookingId: bookingId,
        status: newStatus,
        ...(newStatus === 'IN_PROGRESS' && {
            startedAt: updated?.startedAt?.toISOString(),
        }),
        ...(newStatus === 'AWAITING_REVIEW' && {
            awaitingReviewSince: updated?.awaitingReviewSince?.toISOString(),
        }),
    },
})
```

- [ ] **Step 8: Run lint, build, and tests**

Run:

```bash
npm run lint && npm run build && npx playwright test tests/api/booking-awaiting-review.spec.ts
```

Expected: aucune erreur ; 1 test passe, 7 skip.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/washer/missions/[bookingId]/status/route.ts tests/api/booking-awaiting-review.spec.ts
git commit -m "feat(washer): allow IN_PROGRESS → AWAITING_REVIEW transition with photo gate and feature flag"
```

---

### Task 5: Endpoint cron `POST /api/cron/auto-complete`

**Files:**
- Create: `src/app/api/cron/auto-complete/route.ts`
- Test: `tests/api/cron-auto-complete.spec.ts` (nouveau)

- [ ] **Step 1: Créer le fichier de tests d'auth + skip placeholders**

Créer `tests/api/cron-auto-complete.spec.ts` :

```ts
import { test, expect } from '@playwright/test'

/**
 * Issue #24 — Auto-complete cron endpoint
 *
 * API tests for POST /api/cron/auto-complete (called by Supabase pg_cron hourly).
 * Auth tests are runnable; DB-state tests skip until seeding is in place.
 */
test.describe('Issue #24 — Cron auto-complete', () => {
    test('POST /api/cron/auto-complete returns 401 without x-cron-secret header', async ({ request }) => {
        const response = await request.post('/api/cron/auto-complete')
        expect(response.status()).toBe(401)
    })

    test('POST /api/cron/auto-complete returns 401 with wrong x-cron-secret', async ({ request }) => {
        const response = await request.post('/api/cron/auto-complete', {
            headers: { 'x-cron-secret': 'totally-wrong-value' },
        })
        expect(response.status()).toBe(401)
    })

    test.skip('processes AWAITING_REVIEW bookings older than 24h', async ({ request }) => {
        // TODO: Requires seeded AWAITING_REVIEW booking with awaitingReviewSince > 24h ago + valid CRON_SECRET
        // Expected:
        //   response.status === 200
        //   body.processed >= 1
        //   booking.status === 'COMPLETED' in DB
        //   payment.paidOutAt !== null in DB
        //   one PayoutAttempt row created with triggeredBy='cron', success=true
        void request
    })

    test.skip('skips AWAITING_REVIEW bookings within the 24h window', async ({ request }) => {
        // TODO: Requires seeded AWAITING_REVIEW booking with awaitingReviewSince < 24h ago
        // Expected: booking.status remains AWAITING_REVIEW
        void request
    })

    test.skip('processes legacy IN_PROGRESS bookings older than 7 days with afterPhotoUrl set', async ({ request }) => {
        // TODO: Requires seeded IN_PROGRESS booking with startedAt > 7 days ago + afterPhotoUrl set
        // Expected: status becomes COMPLETED, payout triggered
        void request
    })

    test.skip('skips legacy IN_PROGRESS bookings without afterPhotoUrl', async ({ request }) => {
        // TODO: Requires seeded IN_PROGRESS booking > 7 days, afterPhotoUrl=null
        // Expected: status remains IN_PROGRESS — no auto-complete without photo evidence
        void request
    })

    test.skip('is idempotent — second immediate call processes 0 bookings', async ({ request }) => {
        // TODO: Run the cron twice in a row; second response.body.processed === 0
        void request
    })
})
```

- [ ] **Step 2: Run the test file to verify both auth tests pass**

Run:

```bash
npx playwright test tests/api/cron-auto-complete.spec.ts
```

Expected: 2 pass (both 401 cases), 5 skip. Tests vont échouer car l'endpoint n'existe pas encore ; c'est attendu pour le green-step suivant.

Si les deux 401 retournent 404 (route inexistante), c'est aussi acceptable comme « failing test » avant l'implémentation. Les rendre passants est l'objectif du Step 4.

- [ ] **Step 3: Implémenter le route handler**

Créer `src/app/api/cron/auto-complete/route.ts` :

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { triggerPayout } from '@/lib/actions/payout'

/**
 * POST /api/cron/auto-complete
 *
 * Called by Supabase pg_cron every hour. Two responsibilities:
 * 1. Auto-complete bookings that have been in AWAITING_REVIEW for > 24h.
 * 2. Auto-complete legacy bookings that have been stuck in IN_PROGRESS for > 7 days
 *    AND have an afterPhotoUrl (proof of work). Bookings without an after-photo are
 *    left for admin intervention.
 *
 * Auth: header `x-cron-secret` must match process.env.CRON_SECRET.
 */
export async function POST(req: Request) {
    if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const reviewCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const legacyCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Eligible bookings — read-only select first, mutate one by one for idempotence.
    const candidates = await prisma.booking.findMany({
        where: {
            OR: [
                {
                    status: 'AWAITING_REVIEW',
                    awaitingReviewSince: { lt: reviewCutoff },
                },
                {
                    status: 'IN_PROGRESS',
                    startedAt: { lt: legacyCutoff },
                    afterPhotoUrl: { not: null },
                },
            ],
        },
        select: { id: true, status: true },
    })

    const errors: { bookingId: string; error: string }[] = []
    let succeeded = 0
    let failed = 0

    for (const candidate of candidates) {
        try {
            // Atomic guarded update — re-checks the status to avoid races with manual completes.
            const result = await prisma.booking.updateMany({
                where: { id: candidate.id, status: candidate.status },
                data: {
                    status: 'COMPLETED',
                    completedAt: now,
                    validatedAt: now,
                },
            })

            if (result.count === 0) {
                // Another actor completed it between SELECT and UPDATE — skip silently.
                continue
            }

            const payoutResult = await triggerPayout(candidate.id, { triggeredBy: 'cron' })
            if (payoutResult.success) {
                succeeded += 1
            } else {
                failed += 1
                errors.push({ bookingId: candidate.id, error: payoutResult.error || 'unknown payout error' })
            }
        } catch (err: any) {
            failed += 1
            errors.push({ bookingId: candidate.id, error: err?.message || 'exception during processing' })
        }
    }

    return NextResponse.json({
        success: true,
        processed: candidates.length,
        succeeded,
        failed,
        errors,
    })
}
```

- [ ] **Step 4: Vérifier que les tests d'auth passent**

Run:

```bash
npx playwright test tests/api/cron-auto-complete.spec.ts
```

Expected: 2 pass, 5 skip.

- [ ] **Step 5: Run lint and build**

Run:

```bash
npm run lint && npm run build
```

Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/cron/auto-complete/route.ts tests/api/cron-auto-complete.spec.ts
git commit -m "feat(cron): add /api/cron/auto-complete endpoint with 24h review + 7d legacy fallback"
```

---

### Task 6: Endpoint admin `GET /api/admin/payouts/failures`

**Files:**
- Create: `src/app/api/admin/payouts/failures/route.ts`
- Test: `tests/api/payout-attempt.spec.ts` (nouveau)

- [ ] **Step 1: Créer le fichier de tests**

Créer `tests/api/payout-attempt.spec.ts` :

```ts
import { test, expect } from '@playwright/test'

/**
 * Issue #24 — PayoutAttempt audit visibility
 *
 * API tests for GET /api/admin/payouts/failures.
 */
test.describe('Issue #24 — Admin payout failures view', () => {
    test('GET /api/admin/payouts/failures returns 401 for unauthenticated request', async ({ request }) => {
        const response = await request.get('/api/admin/payouts/failures')
        expect(response.status()).toBe(401)
    })

    test.skip('returns 403 for non-admin authenticated user', async ({ request }) => {
        // TODO: Requires authenticated CLIENT or LAVEUR session
        void request
    })

    test.skip('returns aggregated failures with last-attempt-per-booking', async ({ request }) => {
        // TODO: Requires authenticated ADMIN session + seeded PayoutAttempt rows (mix of success/failure across multiple bookings)
        // Expected:
        //   response.status === 200
        //   body.failures is an array
        //   each failure has: bookingId, lastAttemptAt, errorCode, errorMessage, attemptCount, bookingStatus, paidOut
        //   only bookings whose latest attempt has success=false appear (i.e., later successful retry hides them)
        void request
    })
})
```

- [ ] **Step 2: Run the new tests**

Run:

```bash
npx playwright test tests/api/payout-attempt.spec.ts
```

Expected: 1 pass (sera 404 sans la route ; passera à 401 après le step suivant), 2 skip.

- [ ] **Step 3: Implémenter le route handler**

Créer `src/app/api/admin/payouts/failures/route.ts` :

```ts
import { NextResponse } from 'next/server'
import { withAdminGuard } from '@/lib/auth/adminGuard'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/payouts/failures
 *
 * Returns one row per booking whose **latest** PayoutAttempt has success=false.
 * Used by admins to surface silent payout breakdowns (issue #24, cause B).
 */
export const GET = withAdminGuard(async () => {
    // Fetch all attempts ordered by booking + most recent first.
    // We aggregate in memory rather than via raw SQL because Prisma doesn't expose
    // window functions — the volume here (failures only) stays small in practice.
    const recentAttempts = await prisma.payoutAttempt.findMany({
        orderBy: [{ bookingId: 'asc' }, { attemptedAt: 'desc' }],
        include: {
            booking: {
                select: {
                    status: true,
                    payment: { select: { paidOutAt: true } },
                },
            },
        },
    })

    type Aggregated = {
        bookingId: string
        lastAttemptAt: Date
        errorCode: string | null
        errorMessage: string | null
        attemptCount: number
        bookingStatus: string
        paidOut: boolean
        latestSuccess: boolean
    }

    const byBooking = new Map<string, Aggregated>()
    for (const attempt of recentAttempts) {
        const existing = byBooking.get(attempt.bookingId)
        if (!existing) {
            byBooking.set(attempt.bookingId, {
                bookingId: attempt.bookingId,
                lastAttemptAt: attempt.attemptedAt,
                errorCode: attempt.errorCode,
                errorMessage: attempt.errorMessage,
                attemptCount: 1,
                bookingStatus: attempt.booking.status,
                paidOut: attempt.booking.payment?.paidOutAt != null,
                latestSuccess: attempt.success,
            })
        } else {
            existing.attemptCount += 1
        }
    }

    const failures = Array.from(byBooking.values())
        .filter((row) => !row.latestSuccess)
        .map(({ latestSuccess: _ls, ...rest }) => rest)
        .sort((a, b) => b.lastAttemptAt.getTime() - a.lastAttemptAt.getTime())

    return NextResponse.json({ success: true, failures })
})
```

- [ ] **Step 4: Vérifier que les tests passent**

Run:

```bash
npx playwright test tests/api/payout-attempt.spec.ts
```

Expected: 1 pass (le 401), 2 skip.

- [ ] **Step 5: Run lint and build**

Run:

```bash
npm run lint && npm run build
```

Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/payouts/failures/route.ts tests/api/payout-attempt.spec.ts
git commit -m "feat(admin): add GET /api/admin/payouts/failures view aggregating PayoutAttempt"
```

---

### Task 7: UI client — `MissionValidationCard` gère `AWAITING_REVIEW`

**Files:**
- Modify: `src/components/features/dashboard/MissionValidationCard.tsx`

Note : ce composant est consommé par `ClientDashboardView`. Vérifier que le type des props inclut `awaitingReviewSince` côté appelant ; sinon Prisma le sérialise déjà via `GET /api/customer/bookings`.

- [ ] **Step 1: Élargir le type des props et la garde de rendu**

Remplacer l'interface `MissionValidationCardProps` :

```ts
interface MissionValidationCardProps {
    booking: {
        id: string
        beforePhotoUrl: string | null
        afterPhotoUrl: string | null
        status: string
        awaitingReviewSince: string | null
    }
    onValidated: () => void
}
```

Et la garde initiale :

```ts
// Render only for IN_PROGRESS (legacy / no laveur signal yet) or AWAITING_REVIEW (laveur signaled end)
if (!['IN_PROGRESS', 'AWAITING_REVIEW'].includes(booking.status)) return null
```

- [ ] **Step 2: Ajouter un compteur de la fenêtre de 24 h pour `AWAITING_REVIEW`**

Juste avant `return (` du happy path (la branche photos affichées + bouton), ajouter :

```ts
const reviewWindowMs = 24 * 60 * 60 * 1000
const remainingMs = booking.awaitingReviewSince
    ? Math.max(0, new Date(booking.awaitingReviewSince).getTime() + reviewWindowMs - Date.now())
    : null
const remainingHours = remainingMs != null ? Math.ceil(remainingMs / (60 * 60 * 1000)) : null
```

- [ ] **Step 3: Afficher le compteur en bandeau au-dessus des photos pour `AWAITING_REVIEW`**

Dans la branche du happy path (juste après le `<p className="text-sm font-medium text-gray-700 mb-3">Photos du lavage</p>`), ajouter conditionnellement :

```tsx
{booking.status === 'AWAITING_REVIEW' && remainingHours != null && (
    <div className="mb-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-900">
        Votre laveur a terminé la mission. Vous avez encore <strong>{remainingHours} h</strong> pour valider ou contester.
    </div>
)}
```

- [ ] **Step 4: Ne pas afficher la branche « En attente des photos du laveur » en `AWAITING_REVIEW`**

Le `if (!booking.afterPhotoUrl)` actuel rend la branche d'attente. En `AWAITING_REVIEW`, les deux photos sont garanties (sinon la transition aurait été refusée côté API). Pour rester défensif, ajouter une condition :

```ts
if (booking.status === 'IN_PROGRESS' && !booking.afterPhotoUrl) {
    return (
        // ... branche existante « En attente des photos du laveur »
    )
}
```

(Remplacer la garde existante `if (!booking.afterPhotoUrl)` par la version conditionnelle au statut.)

- [ ] **Step 5: Mettre à jour les appelants pour passer `awaitingReviewSince`**

Vérifier que `ClientDashboardView.tsx` passe `awaitingReviewSince` dans les props du composant. Run:

```bash
grep -n "MissionValidationCard" src/components/Dashboard/ClientDashboardView.tsx
```

Si l'appel ressemble à `<MissionValidationCard booking={...} onValidated={...} />`, vérifier que l'objet `booking` provient bien de `GET /api/customer/bookings` qui sérialise déjà `awaitingReviewSince`. Si l'API ne le retourne pas encore, l'ajouter au `select` de cette route.

(Ouvrir `src/app/api/customer/bookings/route.ts` ou équivalent. Si le booking est retourné via un `select` explicite, ajouter `awaitingReviewSince: true`. Si le retour est `prisma.booking.findMany({})` sans select, le champ est inclus automatiquement — rien à faire.)

- [ ] **Step 6: Run lint and build**

Run:

```bash
npm run lint && npm run build
```

Expected: aucune erreur TypeScript ; l'élargissement du type des props peut révéler que d'autres appelants ne passent pas `awaitingReviewSince` — corriger en cascade.

- [ ] **Step 7: Test manuel rapide via le dev server**

Run:

```bash
npm run dev
```

Naviguer vers `/dashboard` en tant que client avec un booking de test. Vérifier visuellement que la branche `AWAITING_REVIEW` (à provoquer manuellement en mettant à jour le statut côté DB pour un booking de test) affiche le bandeau bleu.

Tuer le dev server (Ctrl-C) une fois vérifié.

- [ ] **Step 8: Commit**

```bash
git add src/components/features/dashboard/MissionValidationCard.tsx src/components/Dashboard/ClientDashboardView.tsx src/app/api/customer/bookings/route.ts
git commit -m "feat(client-ui): show 24h countdown banner for AWAITING_REVIEW bookings"
```

(Ne stagér que les fichiers réellement modifiés.)

---

### Task 8: UI laveur — bouton « Mission terminée » dans `WasherDashboardView`

**Files:**
- Modify: `src/components/Dashboard/WasherDashboardView.tsx`

- [ ] **Step 1: Localiser la zone d'affichage des missions acceptées**

Run:

```bash
grep -n "IN_PROGRESS\|EN_ROUTE\|status" src/components/Dashboard/WasherDashboardView.tsx | head -30
```

Identifier la section qui rend les boutons d'action côté laveur (probablement un `switch` ou des conditionnelles sur `mission.status`).

- [ ] **Step 2: Ajouter une fonction handler pour passer en `AWAITING_REVIEW`**

Près des autres handlers existants (typiquement `handleAcceptMission`, `handleStartRoute`, etc.), ajouter :

```ts
const handleFinishMission = async (missionId: string) => {
    const res = await fetch(`/api/washer/missions/${missionId}/status`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'AWAITING_REVIEW' }),
    })
    const body = await res.json()
    if (!body.success) {
        // Reuse the existing toast/error pattern in this file
        alert(body.error || 'Impossible de terminer la mission.')
        return
    }
    // Refresh missions — reuse the existing reload function (e.g., refetch())
    await reloadMissions()
}
```

(Si le composant utilise `useToast()` ou un pattern d'erreur dédié, l'utiliser à la place de `alert`. Suivre le même pattern que les autres handlers du fichier.)

- [ ] **Step 3: Ajouter le bouton dans la branche `IN_PROGRESS`**

Dans le rendu d'une mission, repérer la branche `mission.status === 'IN_PROGRESS'`. Ajouter un bouton :

```tsx
{mission.status === 'IN_PROGRESS' && (
    <button
        onClick={() => handleFinishMission(mission.id)}
        disabled={!mission.beforePhotoUrl || !mission.afterPhotoUrl}
        title={
            !mission.beforePhotoUrl || !mission.afterPhotoUrl
                ? 'Photos avant et après requises pour terminer la mission'
                : undefined
        }
        className="bg-[#004aad] text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-[#003c8a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
        Mission terminée
    </button>
)}
```

(Adapter les classes Tailwind au pattern existant dans le composant.)

- [ ] **Step 4: Ajouter une indication visuelle pour `AWAITING_REVIEW`**

Dans la même branche de rendu, gérer le statut `AWAITING_REVIEW` :

```tsx
{mission.status === 'AWAITING_REVIEW' && (
    <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-sm text-amber-900">
        En attente de validation client (sous 24 h, sinon validation automatique).
    </div>
)}
```

- [ ] **Step 5: Vérifier que l'API laveur retourne bien `beforePhotoUrl` / `afterPhotoUrl` dans la liste des missions**

Run:

```bash
grep -n "select\|beforePhotoUrl\|afterPhotoUrl" src/app/api/washer/missions/accepted/route.ts
```

Si le `select` Prisma omet ces champs, les ajouter. Sinon, rien à faire.

- [ ] **Step 6: Run lint and build**

Run:

```bash
npm run lint && npm run build
```

Expected: aucune erreur.

- [ ] **Step 7: Test manuel rapide**

Run:

```bash
npm run dev
```

Avec un compte laveur de test ayant une mission en `IN_PROGRESS`, vérifier :
1. Le bouton « Mission terminée » est désactivé tant que les photos ne sont pas uploadées (tooltip visible au hover).
2. Une fois les photos uploadées, le bouton est cliquable. Le clic passe la mission en `AWAITING_REVIEW` et la liste se rafraîchit.
3. La mission affiche maintenant le bandeau ambre « En attente de validation client ».

Pour activer le flag : exporter `WASHER_CAN_FINISH=true` (déjà dans `.env.local` ou ajouté en Task 10). Sinon le clic renvoie 403 « Fonctionnalité indisponible ».

Tuer le dev server.

- [ ] **Step 8: Commit**

```bash
git add src/components/Dashboard/WasherDashboardView.tsx src/app/api/washer/missions/accepted/route.ts
git commit -m "feat(washer-ui): add Mission terminée button gated by photos and feature flag"
```

(Ne stagér que les fichiers réellement modifiés.)

---

### Task 9: Provisionnement `pg_cron` Supabase

**Files:**
- Create: `supabase/cron.sql`

Note : ce fichier ne s'exécute pas automatiquement. Il documente la commande SQL à coller dans le SQL editor Supabase post-déploiement.

- [ ] **Step 1: Créer le dossier et le fichier SQL**

Run:

```bash
mkdir -p supabase
```

Créer `supabase/cron.sql` :

```sql
-- =====================================================================
-- Issue #24 — Auto-complete bookings cron
-- =====================================================================
-- Ce script provisionne un job pg_cron horaire qui appelle l'endpoint
-- POST /api/cron/auto-complete avec le secret CRON_SECRET dans le header.
-- À exécuter dans le SQL editor Supabase (ou via supabase CLI db query).
--
-- Pré-requis :
--   1. Avoir CRON_SECRET défini dans Supabase Vault sous la clé 'cron_secret'
--      (Dashboard Supabase → Project Settings → Vault → Add new secret)
--   2. Connaître l'URL de prod : https://<APP_URL>/api/cron/auto-complete
--
-- Idempotent : ré-exécution safe (on unschedule avant de reschedule).
-- =====================================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Unschedule any previous run (idempotent)
do $$
begin
    perform cron.unschedule('auto-complete-bookings');
exception when others then null;  -- ignore if not scheduled yet
end $$;

-- Schedule hourly call to the Next.js endpoint
select cron.schedule(
    'auto-complete-bookings',
    '0 * * * *',
    $cron$
    select net.http_post(
        url := 'https://REPLACE_WITH_PROD_APP_URL/api/cron/auto-complete',
        headers := jsonb_build_object(
            'content-type', 'application/json',
            'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
        ),
        timeout_milliseconds := 30000
    );
    $cron$
);

-- Sanity check : list scheduled jobs
select jobname, schedule, active from cron.job where jobname = 'auto-complete-bookings';
```

- [ ] **Step 2: Vérifier que le dossier est tracké par git**

Run:

```bash
git status supabase/
```

Expected: `supabase/cron.sql` listé en untracked.

- [ ] **Step 3: Commit**

```bash
git add supabase/cron.sql
git commit -m "chore(cron): add Supabase pg_cron provisioning script for auto-complete"
```

---

### Task 10: Documentation — `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Mettre à jour la description du cycle de vie booking**

Localiser la ligne (dans la section « Modèle de données clé ») :

```
- **Booking** : cycle de vie `PENDING → CONFIRMED → ACCEPTED → EN_ROUTE → IN_PROGRESS → COMPLETED/CANCELLED`.
```

Remplacer par :

```
- **Booking** : cycle de vie `PENDING → CONFIRMED → ACCEPTED → EN_ROUTE → IN_PROGRESS → AWAITING_REVIEW → COMPLETED/CANCELLED`. Le passage en `AWAITING_REVIEW` est déclenché par le laveur (avec photos avant/après obligatoires) ; le client a 24 h pour valider via `POST /api/booking/[id]/complete` ou contester. Sans réponse, un cron `pg_cron` horaire passe le booking en `COMPLETED` automatiquement (cf. `supabase/cron.sql`).
```

- [ ] **Step 2: Ajouter la mention de `PayoutAttempt`**

Dans la même section, juste après la description de `Payment`, ajouter :

```
- **PayoutAttempt** : audit trail de chaque appel à `triggerPayout()` (succès et échecs). Champs : `bookingId`, `attemptedAt`, `triggeredBy` (`'client' | 'cron' | 'admin'`), `success`, `errorCode`, `errorMessage`. Vue admin via `GET /api/admin/payouts/failures` qui agrège par booking, dernier essai en date.
```

- [ ] **Step 3: Mettre à jour la section payouts**

Dans la section « Flux de paiement », après l'étape 5 sur le payout, remplacer la fin de l'étape 6 par :

```
6. **Commission plateforme** : taux global dans `PlatformSettings`. L'admin peut le modifier via `PATCH /api/admin/settings/commission` (validation 0 ≤ rate ≤ 1). Le taux est **snapshoté** sur chaque Payment au moment du payout, donc les modifications n'impactent que les futures missions.

7. **Auto-complétion et déclenchement payout** :
   - Le laveur peut signaler la fin de mission via `PATCH /api/washer/missions/[id]/status` avec `{ status: 'AWAITING_REVIEW' }` (photos avant + après obligatoires, flag `WASHER_CAN_FINISH=true` requis). Le booking entre en `AWAITING_REVIEW`, `awaitingReviewSince = NOW()`.
   - Le client valide ou conteste sous 24 h. Validation client → `POST /api/booking/[id]/complete` → `triggerPayout()`.
   - Sans validation, le cron Supabase `pg_cron` (`supabase/cron.sql`, fréquence horaire) appelle `POST /api/cron/auto-complete` qui passe les bookings `AWAITING_REVIEW > 24h` en `COMPLETED` et déclenche le payout. Il rattrape aussi les bookings legacy bloqués en `IN_PROGRESS > 7 jours` qui ont une photo après (preuve photo).
   - Chaque appel à `triggerPayout()` (succès ou échec) écrit une ligne dans `PayoutAttempt`.
```

- [ ] **Step 4: Ajouter les variables d'environnement**

Dans la section « Variables d'environnement requises », ajouter à la liste :

```
- `CRON_SECRET` : secret 256 bits (`openssl rand -hex 32`) partagé avec Supabase Vault sous la clé `cron_secret`. Protège l'endpoint `/api/cron/auto-complete`.
- `WASHER_CAN_FINISH` : flag de feature (`'true'` pour activer la transition `IN_PROGRESS → AWAITING_REVIEW` côté laveur). Permet de canary la fonctionnalité sans rollback.
```

- [ ] **Step 5: Mettre à jour la section tests**

Dans la liste des fichiers `tests/api/`, ajouter :

```
booking-awaiting-review, cron-auto-complete, payout-attempt
```

à la liste existante.

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): document AWAITING_REVIEW lifecycle, PayoutAttempt audit, cron, env vars"
```

---

### Task 11: Vérification finale + push

**Files:** aucun changement de code.

- [ ] **Step 1: Run full test suite**

Run:

```bash
npx playwright test tests/api/
```

Expected: tous les tests existants passent + les 3 nouveaux fichiers (`booking-awaiting-review`, `cron-auto-complete`, `payout-attempt`) ont leurs tests d'auth qui passent et le reste skippé.

- [ ] **Step 2: Run full build**

Run:

```bash
npm run lint && npm run build
```

Expected: aucune erreur.

- [ ] **Step 3: Vérifier le journal git**

Run:

```bash
git log --oneline main..HEAD
```

Expected (10 commits attendus) :

```
docs(claude): document AWAITING_REVIEW lifecycle, PayoutAttempt audit, cron, env vars
chore(cron): add Supabase pg_cron provisioning script for auto-complete
feat(washer-ui): add Mission terminée button gated by photos and feature flag
feat(client-ui): show 24h countdown banner for AWAITING_REVIEW bookings
feat(admin): add GET /api/admin/payouts/failures view aggregating PayoutAttempt
feat(cron): add /api/cron/auto-complete endpoint with 24h review + 7d legacy fallback
feat(washer): allow IN_PROGRESS → AWAITING_REVIEW transition with photo gate and feature flag
feat(booking): allow /complete from AWAITING_REVIEW in addition to IN_PROGRESS
feat(payout): record PayoutAttempt audit row on every triggerPayout invocation
feat(schema): add AWAITING_REVIEW status, awaiting_review_since field, payout_attempts table
```

(Plus le commit du spec et celui du plan, déjà présents.)

- [ ] **Step 4: Pusher la branche**

Run:

```bash
git push -u origin fix/payout-trigger
```

- [ ] **Step 5: Ouvrir une PR draft via gh**

Run:

```bash
gh pr create --draft --title "fix(payout): laveur signal end-of-mission + 24h auto-complete cron" --body "$(cat <<'EOF'
## Summary

Implémente issue #24 — résout le bug où les laveurs ne reçoivent pas de payout automatique en fin de mission.

- Ajoute le statut `AWAITING_REVIEW` (laveur signale la fin avec photos avant/après obligatoires)
- Le client a 24 h pour valider via le dashboard ; sinon, un cron `pg_cron` horaire (Supabase) auto-complète et déclenche le payout
- Ajoute la table `PayoutAttempt` pour rendre visibles les échecs silencieux de payout (cause B mentionnée dans l'issue)
- Flag de feature `WASHER_CAN_FINISH` pour canary sans rollback DB

Voir le spec complet : `docs/superpowers/specs/2026-04-28-payout-trigger-design.md`

## Test plan

- [ ] Tests d'auth Playwright passent en local (`npx playwright test tests/api/`)
- [ ] `npm run build` passe
- [ ] Test manuel : laveur clique « Mission terminée » → mission en `AWAITING_REVIEW` ; client voit le bandeau 24 h
- [ ] Test manuel : client clique « Valider la prestation » → booking `COMPLETED`, payout déclenché, ligne `PayoutAttempt` `success=true`
- [ ] Provisionner `supabase/cron.sql` post-merge, vérifier que le job `auto-complete-bookings` apparaît dans `cron.job`
- [ ] Vérifier que les 5 bookings actuellement bloqués en `IN_PROGRESS` (cf. SQL diag dans le spec) sont rattrapés au premier run du cron (ceux avec `afterPhotoUrl` uniquement)

## Hors scope (issues de suivi à créer)

- Endpoint `POST /api/booking/[id]/dispute` (refund client pendant `AWAITING_REVIEW`)
- Notifications email (Resend) au passage en `AWAITING_REVIEW`
- UI admin pour `GET /api/admin/payouts/failures`
- Retry automatique des payouts échoués

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: la commande retourne l'URL de la PR draft. La passer en « ready for review » manuellement après vérification.

- [ ] **Step 6: Marquer la tâche complète**

Cette tâche n'a pas de commit dédié (pas de fichier modifié) — passer simplement à l'étape suivante : provisionnement Vault + activation flag + run du SQL `supabase/cron.sql` post-merge, en coordination avec l'utilisateur.
