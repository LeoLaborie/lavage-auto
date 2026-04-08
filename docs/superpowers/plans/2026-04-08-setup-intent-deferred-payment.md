# Setup Intent + Paiement Différé — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer le flux Stripe de Checkout `payment` (manual capture) vers Checkout `setup` + débit off-session à l'acceptation du laveur, supprimant la limite de 7 jours d'autorisation.

**Architecture:** Stripe Checkout en mode `setup` enregistre la carte du client sur un Stripe Customer. Quand un laveur accepte, un PaymentIntent off-session débite la carte immédiatement. En cas d'échec, la réservation est annulée.

**Tech Stack:** Next.js App Router, Prisma, Stripe (Checkout Setup, PaymentIntents off-session), PostgreSQL

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `prisma/schema.prisma` | Modify | Ajouter `stripeCustomerId` sur Profile |
| `src/lib/stripe.ts` | Modify | Ajouter `createSetupCheckoutSession` + `chargeCustomer`, garder l'ancien `createCheckoutSession` pour rétrocompatibilité du payout |
| `src/app/api/booking/submit/route.ts` | Modify | Créer/récupérer Stripe Customer, utiliser setup session |
| `src/app/api/webhooks/stripe/route.ts` | Modify | Gérer `checkout.session.completed` en mode setup (pas de Payment) |
| `src/app/api/washer/missions/accept/route.ts` | Modify | Débiter le client après le claim atomique |
| `src/app/api/customer/bookings/cancel/route.ts` | Modify | Simplifier : pas de PI avant acceptation |
| `src/lib/actions/payout.ts` | Modify | Capture conditionnelle (rétrocompat anciens bookings) |
| `src/components/booking/StepConfirmation.tsx` | Modify | Textes bouton et info |
| `src/app/booking/success/page.tsx` | Modify | Textes adaptés au setup (pas de "paiement accepté") |

---

### Task 1: Schema Prisma — Ajouter `stripeCustomerId` sur Profile

**Files:**
- Modify: `prisma/schema.prisma:100` (après `stripeAccountId`)

- [ ] **Step 1: Ajouter le champ au schema**

Dans `prisma/schema.prisma`, après la ligne 100 (`stripeAccountId`), ajouter :

```prisma
  stripeCustomerId String?  @unique @map("stripe_customer_id")  // Stripe Customer for saved payment methods
```

- [ ] **Step 2: Générer le client Prisma**

Run: `npx prisma generate`
Expected: `✔ Generated Prisma Client`

- [ ] **Step 3: Appliquer le schema à la base**

Run: `npx prisma db push`
Expected: schema appliqué sans erreur, le champ `stripe_customer_id` est ajouté à la table `profiles`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "schema: add stripeCustomerId to Profile for saved payment methods"
```

---

### Task 2: Stripe — Nouvelles fonctions `createSetupCheckoutSession` et `chargeCustomer`

**Files:**
- Modify: `src/lib/stripe.ts`

- [ ] **Step 1: Ajouter `createSetupCheckoutSession`**

Ajouter après la fonction `createCheckoutSession` existante (ligne 48) :

```typescript
/**
 * Creates a Stripe Checkout Session in "setup" mode.
 * The client's card is validated and saved on the Stripe Customer
 * without any charge. The actual charge happens later when a washer accepts.
 */
export async function createSetupCheckoutSession(
    bookingId: string,
    stripeCustomerId: string,
    customerEmail: string,
    serviceName: string,
    amountCents: number
) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return await stripe.checkout.sessions.create({
        mode: 'setup',
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        success_url: `${baseUrl}/booking/success?bookingId=${bookingId}`,
        cancel_url: `${baseUrl}/api/booking/cancel?bookingId=${bookingId}`,
        metadata: {
            bookingId,
            serviceName,
            amountCents: String(amountCents),
        },
        setup_intent_data: {
            metadata: {
                bookingId,
            },
        },
    });
}
```

- [ ] **Step 2: Ajouter `chargeCustomer`**

Ajouter après `createSetupCheckoutSession` :

```typescript
/**
 * Creates and confirms a PaymentIntent off-session using the customer's
 * saved payment method. Used when a washer accepts a mission.
 * Throws on failure (card declined, insufficient funds, etc.).
 */
export async function chargeCustomer(
    stripeCustomerId: string,
    amountCents: number,
    bookingId: string,
    serviceName: string
): Promise<Stripe.PaymentIntent> {
    return await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'eur',
        customer: stripeCustomerId,
        off_session: true,
        confirm: true,
        description: `Lavage Auto: ${serviceName}`,
        metadata: { bookingId },
    }, {
        idempotencyKey: `booking-${bookingId}-charge`,
    });
}
```

- [ ] **Step 3: Ajouter `getOrCreateStripeCustomer`**

Ajouter au début des fonctions exportées (après le client `stripe` ligne 10) :

```typescript
/**
 * Gets or creates a Stripe Customer for the given user.
 * Stores the customer ID on the user's Profile for reuse.
 */
export async function getOrCreateStripeCustomer(
    userId: string,
    email: string,
    existingCustomerId: string | null
): Promise<string> {
    if (existingCustomerId) {
        return existingCustomerId;
    }

    const customer = await stripe.customers.create({
        email,
        metadata: { userId },
    });

    // Import prisma here to avoid circular dependency at module level
    const { prisma } = await import('@/lib/prisma');
    await prisma.profile.update({
        where: { userId },
        data: { stripeCustomerId: customer.id },
    });

    return customer.id;
}
```

- [ ] **Step 4: Vérifier la compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: pas d'erreurs dans `stripe.ts`

- [ ] **Step 5: Commit**

```bash
git add src/lib/stripe.ts
git commit -m "feat: add Setup Checkout, chargeCustomer, and getOrCreateStripeCustomer helpers"
```

---

### Task 3: Route `/api/booking/submit` — Utiliser Setup Checkout

**Files:**
- Modify: `src/app/api/booking/submit/route.ts`

- [ ] **Step 1: Mettre à jour les imports**

Remplacer l'import de `createCheckoutSession` :

```typescript
// Old:
import { createCheckoutSession } from '@/lib/stripe'
// New:
import { createSetupCheckoutSession, getOrCreateStripeCustomer } from '@/lib/stripe'
```

- [ ] **Step 2: Ajouter la récupération/création du Stripe Customer**

Après la sauvegarde du profil client (ligne 214, après le bloc `if (phone || firstName || lastName)`), et avant le commentaire `// --- Create Stripe Checkout Session ---`, ajouter :

```typescript
  // --- Get or create Stripe Customer for saved payment method ---
  const profile = await prisma.profile.findUnique({
    where: { userId: dbUser.id },
    select: { stripeCustomerId: true },
  })

  let stripeCustomerId: string
  try {
    stripeCustomerId = await getOrCreateStripeCustomer(
      dbUser.id,
      dbUser.email,
      profile?.stripeCustomerId ?? null
    )
  } catch (error) {
    console.error('[Stripe] Failed to get/create customer:', error)
    await prisma.booking.delete({ where: { id: booking.id } })
    return NextResponse.json(
      { success: false, error: 'Impossible de configurer le paiement. Veuillez réessayer.' },
      { status: 502 }
    )
  }
```

- [ ] **Step 3: Remplacer `createCheckoutSession` par `createSetupCheckoutSession`**

Remplacer le bloc `try` existant (lignes 217-254) :

```typescript
  // --- Create Stripe Setup Checkout Session ---
  try {
    const session = await createSetupCheckoutSession(
      booking.id,
      stripeCustomerId,
      dbUser.email,
      matchedService.name,
      amountCents
    )

    if (!session.url) {
      console.error('[Stripe] Setup session created but missing URL for booking:', booking.id)
      await prisma.booking.delete({ where: { id: booking.id } })
      return NextResponse.json(
        { success: false, error: 'Le paiement n\'a pas pu être initialisé. Veuillez réessayer.' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId: booking.id,
        checkoutUrl: session.url,
      },
    })
  } catch (error) {
    console.error('[Stripe] Setup session creation failed:', error)
    try {
      await prisma.booking.delete({ where: { id: booking.id } })
    } catch (deleteError) {
      console.error('[Stripe] Failed to delete orphan booking:', booking.id, deleteError)
    }
    return NextResponse.json(
      { success: false, error: 'Le paiement n\'a pas pu être initialisé. Veuillez réessayer.' },
      { status: 502 }
    )
  }
```

- [ ] **Step 4: Vérifier la compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: pas d'erreurs

- [ ] **Step 5: Commit**

```bash
git add src/app/api/booking/submit/route.ts
git commit -m "feat: switch booking submit to Stripe Setup Checkout"
```

---

### Task 4: Webhook Stripe — Gérer le mode setup

**Files:**
- Modify: `src/app/api/webhooks/stripe/route.ts`

- [ ] **Step 1: Modifier le handler `checkout.session.completed`**

Remplacer le bloc `if (event.type === 'checkout.session.completed')` (lignes 36-93) par :

```typescript
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session
            const bookingId = session.metadata?.bookingId

            if (!bookingId) {
                console.error('[Stripe Webhook] Missing bookingId in metadata')
                return NextResponse.json({ success: false, error: 'Missing bookingId' }, { status: 200 })
            }

            if (session.mode === 'setup') {
                // Setup mode: card saved, no payment yet
                // Just confirm the booking — Payment record will be created at washer acceptance
                await prisma.$transaction(async (tx) => {
                    const booking = await tx.booking.findUnique({
                        where: { id: bookingId }
                    })

                    if (!booking) {
                        throw new Error(`Booking not found: ${bookingId}`)
                    }

                    // Idempotency: only transition PENDING → CONFIRMED
                    if (booking.status !== 'PENDING') {
                        console.log(`[Stripe Webhook] Booking ${bookingId} already ${booking.status}, skipping`)
                        return
                    }

                    await tx.booking.update({
                        where: { id: bookingId },
                        data: { status: 'CONFIRMED' }
                    })
                })

                console.log(`[Stripe Webhook] Booking ${bookingId} confirmed (setup mode — card saved)`)
            } else {
                // Legacy payment mode: keep existing logic for backwards compatibility
                const paymentIntentId = typeof session.payment_intent === 'string'
                    ? session.payment_intent
                    : session.payment_intent?.id ?? null;

                await prisma.$transaction(async (tx) => {
                    const booking = await tx.booking.findUnique({
                        where: { id: bookingId }
                    })

                    if (!booking) {
                        throw new Error(`Booking not found: ${bookingId}`)
                    }

                    if (booking.status !== 'PENDING') {
                        console.log(`[Stripe Webhook] Booking ${bookingId} already ${booking.status}, skipping`)
                        return
                    }

                    await tx.booking.update({
                        where: { id: bookingId },
                        data: { status: 'CONFIRMED' }
                    })

                    await tx.payment.upsert({
                        where: { bookingId },
                        update: {
                            status: 'SUCCEEDED',
                            stripeSessionId: session.id,
                            stripePaymentIntentId: paymentIntentId,
                            processedAt: new Date(),
                        },
                        create: {
                            bookingId,
                            userId: booking.clientId,
                            amountCents: booking.amountCents,
                            currency: booking.currency,
                            status: 'SUCCEEDED',
                            stripeSessionId: session.id,
                            stripePaymentIntentId: paymentIntentId,
                            processedAt: new Date(),
                        }
                    })
                })

                console.log(`[Stripe Webhook] Booking ${bookingId} confirmed (payment mode — legacy)`)
            }
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: pas d'erreurs

- [ ] **Step 3: Commit**

```bash
git add src/app/api/webhooks/stripe/route.ts
git commit -m "feat: handle setup mode in Stripe webhook with legacy payment fallback"
```

---

### Task 5: Route `/api/washer/missions/accept` — Débiter à l'acceptation

**Files:**
- Modify: `src/app/api/washer/missions/accept/route.ts`

- [ ] **Step 1: Ajouter les imports**

Remplacer les imports existants :

```typescript
import { NextResponse } from 'next/server'
import { withWasherGuard } from '@/lib/auth/washerGuard'
import { prisma } from '@/lib/prisma'
import { chargeCustomer } from '@/lib/stripe'
```

- [ ] **Step 2: Remplacer le corps de la route**

Remplacer tout le contenu du handler (à l'intérieur de `withWasherGuard(async (req, _user, profile) => { ... })`) :

```typescript
    try {
        const { bookingId } = await req.json()

        if (!bookingId || typeof bookingId !== 'string') {
            return NextResponse.json(
                { success: false, error: 'bookingId est requis' },
                { status: 400 }
            )
        }

        // 1. Atomic claim: only one washer can win
        const result = await prisma.booking.updateMany({
            where: {
                id: bookingId,
                laveurId: null,
                status: { in: ['PENDING', 'CONFIRMED'] }
            },
            data: {
                laveurId: profile.userId,
                status: 'ACCEPTED'
            }
        })

        if (result.count === 0) {
            return NextResponse.json(
                { success: false, error: "Cette mission a déjà été acceptée ou n'est plus disponible." },
                { status: 409 }
            )
        }

        // 2. Load booking with client profile to get stripeCustomerId
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                client: {
                    include: { profile: true }
                }
            }
        })

        if (!booking) {
            // Should never happen since we just updated it
            return NextResponse.json(
                { success: false, error: 'Réservation introuvable après acceptation' },
                { status: 500 }
            )
        }

        const stripeCustomerId = booking.client.profile?.stripeCustomerId
        if (!stripeCustomerId) {
            // No saved payment method — cancel the booking
            console.error(`[accept] Booking ${bookingId}: client has no stripeCustomerId — cancelling`)
            await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'CANCELLED',
                    laveurId: null,
                    cancelledAt: new Date(),
                    cancellationReason: 'Client sans moyen de paiement enregistré',
                },
            })
            return NextResponse.json(
                { success: false, error: 'Le client n\'a pas de moyen de paiement enregistré. La mission a été annulée.' },
                { status: 422 }
            )
        }

        // 3. Charge the customer off-session
        try {
            const paymentIntent = await chargeCustomer(
                stripeCustomerId,
                booking.amountCents,
                bookingId,
                booking.serviceName
            )

            // 4. Create Payment record
            await prisma.payment.create({
                data: {
                    bookingId,
                    userId: booking.clientId,
                    amountCents: booking.amountCents,
                    currency: booking.currency,
                    status: 'SUCCEEDED',
                    stripePaymentIntentId: paymentIntent.id,
                    processedAt: new Date(),
                },
            })

            return NextResponse.json({
                success: true,
                data: { bookingId }
            })
        } catch (stripeError: any) {
            // 5. Payment failed — cancel the booking
            console.error(`[accept] Payment failed for booking ${bookingId}:`, stripeError.message)
            await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'CANCELLED',
                    laveurId: null,
                    cancelledAt: new Date(),
                    cancellationReason: `Échec du paiement: ${stripeError.message}`,
                },
            })
            return NextResponse.json(
                { success: false, error: 'Le paiement du client a échoué. La mission a été annulée.' },
                { status: 422 }
            )
        }
    } catch (error) {
        console.error('Error accepting mission:', error)
        return NextResponse.json(
            { success: false, error: 'Une erreur est survenue lors de l\'acceptation de la mission' },
            { status: 500 }
        )
    }
```

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: pas d'erreurs

- [ ] **Step 4: Commit**

```bash
git add src/app/api/washer/missions/accept/route.ts
git commit -m "feat: charge customer off-session when washer accepts mission"
```

---

### Task 6: Route `/api/customer/bookings/cancel` — Simplifier la logique Stripe

**Files:**
- Modify: `src/app/api/customer/bookings/cancel/route.ts`

- [ ] **Step 1: Remplacer le bloc auto-refund**

Remplacer le bloc de refund existant (lignes 69-109) par :

```typescript
        // Auto-refund: only needed if a Payment exists (i.e., after washer acceptance)
        if (updatedBooking.payment && updatedBooking.payment.stripePaymentIntentId) {
            try {
                const pi = await stripe.paymentIntents.retrieve(updatedBooking.payment.stripePaymentIntentId)

                if (pi.status === 'requires_capture') {
                    // Legacy: manual-capture PI not yet captured — cancel to release hold
                    await stripe.paymentIntents.cancel(updatedBooking.payment.stripePaymentIntentId)
                    console.info(
                        '[cancel] Uncaptured PI cancelled for booking %s (PI: %s)',
                        bookingId,
                        updatedBooking.payment.stripePaymentIntentId
                    )
                } else if (pi.status === 'succeeded') {
                    // New flow or legacy captured: issue refund
                    await stripe.refunds.create({
                        payment_intent: updatedBooking.payment.stripePaymentIntentId,
                        amount: updatedBooking.payment.amountCents,
                        reason: 'requested_by_customer',
                    })
                    console.info(
                        '[cancel] Refund issued for booking %s: %d cents',
                        bookingId,
                        updatedBooking.payment.amountCents
                    )
                }
                // If PI is in another state (cancelled, etc.), no action needed

                await prisma.payment.update({
                    where: { id: updatedBooking.payment.id },
                    data: {
                        refundAmountCents: updatedBooking.payment.amountCents,
                        status: 'REFUNDED',
                        refundedAt: new Date(),
                        refundReason: 'Client cancellation',
                    },
                })
            } catch (refundError) {
                // Log but don't block cancellation — admin can retry refund manually
                console.error('[cancel] Auto-refund failed for booking %s:', bookingId, refundError)
            }
        }
        // Before washer acceptance: no Payment exists, nothing to refund
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: pas d'erreurs

- [ ] **Step 3: Commit**

```bash
git add src/app/api/customer/bookings/cancel/route.ts
git commit -m "fix: simplify cancel refund logic for setup intent flow with legacy compat"
```

---

### Task 7: `triggerPayout` — Capture conditionnelle

**Files:**
- Modify: `src/lib/actions/payout.ts`

- [ ] **Step 1: Ajouter l'import de `stripe`**

Ajouter à l'import existant :

```typescript
import { capturePaymentIntent, createTransfer } from '@/lib/stripe'
import { stripe } from '@/lib/stripe'
```

- [ ] **Step 2: Remplacer la logique de capture**

Remplacer les lignes 89-103 (le bloc de capture + chargeId) par :

```typescript
        // 7. Get the PaymentIntent — may need capture (legacy) or already succeeded (new flow)
        const pi = await stripe.paymentIntents.retrieve(booking.payment.stripePaymentIntentId)

        let chargeId: string | undefined

        if (pi.status === 'requires_capture') {
            // Legacy flow: manual-capture PI — capture it now
            const capturedIntent = await capturePaymentIntent(booking.payment.stripePaymentIntentId)
            chargeId = typeof capturedIntent.latest_charge === 'string'
                ? capturedIntent.latest_charge
                : capturedIntent.latest_charge?.id
        } else if (pi.status === 'succeeded') {
            // New flow: PI already captured at washer acceptance
            chargeId = typeof pi.latest_charge === 'string'
                ? pi.latest_charge
                : pi.latest_charge?.id
        } else {
            return {
                success: false,
                error: `PaymentIntent dans un état inattendu: ${pi.status}. Capture impossible.`,
            }
        }

        if (!chargeId) {
            return {
                success: false,
                error: 'Charge ID introuvable — impossible de créer le transfert',
            }
        }
```

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: pas d'erreurs

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions/payout.ts
git commit -m "fix: conditional capture in triggerPayout for legacy and new payment flows"
```

---

### Task 8: Frontend — Textes StepConfirmation

**Files:**
- Modify: `src/components/booking/StepConfirmation.tsx`

- [ ] **Step 1: Modifier le bouton et ajouter le texte informatif**

Remplacer le bloc `<div className="bg-blue-50 ...">` (lignes 62-67) par :

```tsx
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Paiement sécurisé :</strong> Votre carte sera enregistrée de manière sécurisée.
          Vous ne serez débité que lorsqu&apos;un laveur acceptera votre mission.
        </p>
      </div>
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600">
          Le laveur arrivera avec tout le matériel nécessaire.
          Assurez-vous que votre véhicule soit accessible à l&apos;heure convenue.
        </p>
      </div>
```

- [ ] **Step 2: Modifier le texte du bouton de soumission**

Remplacer le texte du bouton (ligne 94) :

```tsx
// Old:
'Confirmer la réservation'
// New:
'Enregistrer ma carte et réserver'
```

Et le texte de chargement (ligne 91) :

```tsx
// Old:
Confirmation...
// New:
Enregistrement...
```

- [ ] **Step 3: Commit**

```bash
git add src/components/booking/StepConfirmation.tsx
git commit -m "ui: update confirmation step texts for setup intent flow"
```

---

### Task 9: Frontend — Page de succès

**Files:**
- Modify: `src/app/booking/success/page.tsx`

- [ ] **Step 1: Modifier les textes de la page**

Remplacer le titre (ligne 68-69) :

```tsx
// Old:
{booking.status === 'PENDING' ? 'Paiement en cours de traitement' : 'Réservation confirmée !'}
// New:
{booking.status === 'PENDING' ? 'Carte en cours de vérification' : 'Réservation enregistrée !'}
```

Remplacer le sous-titre (lignes 71-73) :

```tsx
// Old:
{booking.status === 'PENDING'
    ? 'Votre paiement est en cours de vérification. Votre réservation sera confirmée dans quelques instants.'
    : 'Votre paiement a été accepté. Un laveur sera assigné à votre mission prochainement.'}
// New:
{booking.status === 'PENDING'
    ? 'Votre carte est en cours de vérification. Votre réservation sera confirmée dans quelques instants.'
    : 'Votre carte a été enregistrée avec succès. Vous ne serez débité que lorsqu\'un laveur acceptera votre mission.'}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/booking/success/page.tsx
git commit -m "ui: update success page texts for setup intent flow"
```

---

### Task 10: Build final + vérification

- [ ] **Step 1: Vérifier la compilation TypeScript**

Run: `npx tsc --noEmit --pretty`
Expected: pas d'erreurs

- [ ] **Step 2: Lancer le build complet**

Run: `npm run build`
Expected: build réussi sans erreurs

- [ ] **Step 3: Lancer le linter**

Run: `npm run lint`
Expected: pas de nouvelles erreurs

- [ ] **Step 4: Commit final si des corrections ont été nécessaires**

Si des corrections ont été faites aux étapes précédentes, les committer individuellement avec des messages descriptifs.
