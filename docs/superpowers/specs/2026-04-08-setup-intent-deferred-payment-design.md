# Setup Intent + Paiement Différé

## Contexte

Le système actuel utilise Stripe Checkout en mode `payment` avec `capture_method: 'manual'`. Le client est autorisé (fonds bloqués) dès la réservation, et le débit réel intervient à la complétion du lavage. Problème : les autorisations Stripe expirent après 7 jours, ce qui bloque les réservations à plus d'une semaine.

## Objectif

Migrer vers Stripe Checkout en mode `setup` pour que :
- Le client enregistre sa carte sans être débité ni bloqué
- Le débit réel n'intervient que quand un laveur accepte la mission
- Aucune limite de temps entre la réservation et l'acceptation

## Flux cible

```
Client réserve → Checkout mode "setup" (carte validée, 0€)
  → webhook checkout.session.completed → Booking CONFIRMED
    → Laveur accepte → PaymentIntent off-session (débit immédiat)
      → Succès → Payment SUCCEEDED, Booking ACCEPTED
      → Échec → Booking CANCELLED, client notifié
```

## Changements détaillés

### 1. Schema Prisma

Ajouter `stripeCustomerId` sur le modèle `Profile` :

```prisma
model Profile {
  // ... champs existants ...
  stripeCustomerId  String?  @unique @map("stripe_customer_id")
}
```

Ce champ lie l'utilisateur à un objet Stripe Customer, nécessaire pour sauvegarder et réutiliser des moyens de paiement.

### 2. Stripe — `createCheckoutSession` → `createSetupCheckoutSession`

Remplacer la session Checkout `payment` par une session `setup` :

```typescript
export async function createSetupCheckoutSession(
  bookingId: string,
  stripeCustomerId: string,
  customerEmail: string,
  serviceName: string,
  amountCents: number
) {
  return await stripe.checkout.sessions.create({
    mode: 'setup',
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    success_url: `${baseUrl}/booking/success?bookingId=${bookingId}`,
    cancel_url: `${baseUrl}/api/booking/cancel?bookingId=${bookingId}`,
    metadata: { bookingId },
    setup_intent_data: {
      metadata: { bookingId },
    },
  });
}
```

Points clés :
- `mode: 'setup'` au lieu de `'payment'`
- `customer` obligatoire (pas juste `customer_email`)
- Pas de `line_items` ni `payment_intent_data`
- Le `amountCents` et `serviceName` ne sont pas passés à Stripe (pas de paiement), mais peuvent servir à afficher un récap dans l'UI

### 3. Stripe — Nouvelle fonction `chargeCustomer`

Créer un PaymentIntent off-session au moment de l'acceptation :

```typescript
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

Points clés :
- `off_session: true` + `confirm: true` : débit immédiat sans interaction client
- `idempotencyKey` : empêche les double-charges en cas de retry
- Utilise le default payment method du Stripe Customer (celui sauvé via Setup)

### 4. Route `/api/booking/submit`

Changements :
1. Créer ou récupérer le Stripe Customer (`profile.stripeCustomerId`)
2. Appeler `createSetupCheckoutSession` au lieu de `createCheckoutSession`
3. Pas de changement sur la création du Booking (reste en PENDING)

```
Booking créé (PENDING) → Stripe Customer créé/récupéré → Setup Checkout Session → redirect
```

### 5. Webhook Stripe

#### `checkout.session.completed` (mode setup)

Changements par rapport au flux actuel :
- En mode setup, `session.payment_intent` est `null`
- `session.setup_intent` contient l'ID du SetupIntent
- **Pas de Payment record créé** à cette étape (pas de paiement)
- Booking passe de PENDING → CONFIRMED

```typescript
if (event.type === 'checkout.session.completed') {
  const session = event.data.object;
  const bookingId = session.metadata?.bookingId;

  if (session.mode === 'setup') {
    // Mode Setup : carte enregistrée, pas de paiement
    await prisma.booking.updateMany({
      where: { id: bookingId, status: 'PENDING' },
      data: { status: 'CONFIRMED' },
    });
    // Pas de Payment record — le paiement viendra à l'acceptation
  }
}
```

#### Événements inchangés
- `checkout.session.expired` : booking annulé (identique)
- `payment_intent.payment_failed` : ne s'applique plus au checkout (mais peut servir pour les charges off-session si on écoute)

### 6. Route `/api/washer/missions/accept`

C'est le changement le plus important. Après le claim atomique, on débite le client :

```
1. updateMany atomique (CONFIRMED → ACCEPTED, set laveurId) — "claim"
2. Récupérer le stripeCustomerId du client
3. chargeCustomer(stripeCustomerId, amountCents, bookingId, serviceName)
4. Si succès : créer Payment record (SUCCEEDED)
5. Si échec : rollback booking → CANCELLED
```

Pseudo-code :
```typescript
// 1. Claim atomique
const result = await prisma.booking.updateMany({
  where: { id: bookingId, laveurId: null, status: 'CONFIRMED' },
  data: { laveurId: profile.userId, status: 'ACCEPTED' },
});
if (result.count === 0) return conflict();

// 2. Charger le booking avec les infos client
const booking = await prisma.booking.findUnique({
  where: { id: bookingId },
  include: { client: { include: { profile: true } } },
});

const stripeCustomerId = booking.client.profile?.stripeCustomerId;
if (!stripeCustomerId) {
  // Rollback + cancel
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED', laveurId: null },
  });
  return error('Client sans moyen de paiement enregistré');
}

// 3. Débiter
try {
  const pi = await chargeCustomer(
    stripeCustomerId,
    booking.amountCents,
    bookingId,
    booking.serviceName
  );

  // 4. Créer le Payment record
  await prisma.payment.create({
    data: {
      bookingId,
      userId: booking.clientId,
      amountCents: booking.amountCents,
      currency: booking.currency,
      status: 'SUCCEEDED',
      stripePaymentIntentId: pi.id,
      processedAt: new Date(),
    },
  });
} catch (stripeError) {
  // 5. Échec du débit → annuler
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED', laveurId: null, cancelledAt: new Date(), cancellationReason: 'Échec du paiement' },
  });
  return error('Le paiement du client a échoué, la mission est annulée.');
}
```

### 7. Route `/api/customer/bookings/cancel`

Simplification selon la phase :

**Avant acceptation (PENDING ou CONFIRMED)** :
- Pas de PaymentIntent → rien à faire côté Stripe
- Booking → CANCELLED

**Après acceptation (ACCEPTED)** :
- PaymentIntent capturé existe → refund classique
- Booking → CANCELLED, Payment → REFUNDED

```typescript
if (updatedBooking.payment?.stripePaymentIntentId) {
  // Après acceptation : PI capturé → refund
  await stripe.refunds.create({
    payment_intent: updatedBooking.payment.stripePaymentIntentId,
    amount: updatedBooking.payment.amountCents,
    reason: 'requested_by_customer',
  });
  // Mettre à jour Payment → REFUNDED
} else {
  // Avant acceptation : pas de PI, rien à faire côté Stripe
}
```

La logique de `requires_capture` vs refund disparaît (plus de capture manuelle).

### 8. `triggerPayout` (payout.ts)

Le PaymentIntent est déjà capturé à l'acceptation. Modifier pour :
1. **Sauter la capture** si le PI est déjà capturé
2. Récupérer le `chargeId` directement depuis le PI
3. Créer le Transfer

```typescript
const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

let chargeId: string;
if (pi.status === 'requires_capture') {
  // Rétrocompatibilité : anciens bookings avec manual capture
  const captured = await capturePaymentIntent(paymentIntentId);
  chargeId = typeof captured.latest_charge === 'string'
    ? captured.latest_charge : captured.latest_charge?.id;
} else if (pi.status === 'succeeded') {
  // Nouveau flux : déjà capturé à l'acceptation
  chargeId = typeof pi.latest_charge === 'string'
    ? pi.latest_charge : pi.latest_charge?.id;
} else {
  return { success: false, error: `PI dans un état inattendu: ${pi.status}` };
}
```

### 9. Frontend

#### StepConfirmation
- Bouton : "Enregistrer ma carte et réserver" au lieu de "Confirmer la réservation"
- Ajouter un texte : "Vous ne serez débité que lorsqu'un laveur acceptera votre mission."

#### Page `/booking/success`
- Titre : "Réservation enregistrée !" au lieu de "Réservation confirmée !"
- Sous-titre : "Votre carte a été enregistrée. Vous serez débité uniquement lorsqu'un laveur acceptera votre mission."
- Supprimer les mentions de "paiement accepté"

#### Texte PENDING sur la page success
- Actuellement : "Votre paiement est en cours de vérification"
- Nouveau : "Votre carte est en cours de vérification"

## Cas limites

| Cas | Comportement |
|-----|-------------|
| Client fait plusieurs réservations | Même Stripe Customer, même carte. Chaque acceptation crée son propre PaymentIntent |
| Client change de carte entre 2 réservations | La nouvelle carte devient la default PM. Les anciennes réservations acceptées après utiliseront la nouvelle carte |
| Aucun laveur n'accepte | Rien ne se passe. Pas de charge, pas de cleanup. La carte reste enregistrée sur le Stripe Customer |
| Booking PENDING expire (30 min) | Inchangé — le setup n'a pas été complété |
| Laveur accepte un booking dont le client a été supprimé | Le `stripeCustomerId` check échoue → booking annulé |
| Acceptation concurrente de 2 laveurs | L'`updateMany` atomique garantit qu'un seul gagne. Le perdant reçoit un 409 |

## Migration / Rétrocompatibilité

- Les bookings existants avec `capture_method: 'manual'` continuent de fonctionner via la logique conditionnelle dans `triggerPayout`
- Aucune migration de données nécessaire : le champ `stripeCustomerId` est nullable
- Les anciens Payment records avec `stripeSessionId` pointant vers des sessions `payment` restent valides

## Fichiers impactés

1. `prisma/schema.prisma` — ajout `stripeCustomerId` sur Profile
2. `src/lib/stripe.ts` — nouvelle fonction `createSetupCheckoutSession` + `chargeCustomer`
3. `src/app/api/booking/submit/route.ts` — Stripe Customer + setup session
4. `src/app/api/webhooks/stripe/route.ts` — gérer mode setup
5. `src/app/api/washer/missions/accept/route.ts` — débit à l'acceptation
6. `src/app/api/customer/bookings/cancel/route.ts` — simplifier la logique
7. `src/lib/actions/payout.ts` — capture conditionnelle
8. `src/components/booking/StepConfirmation.tsx` — textes
9. `src/app/booking/success/page.tsx` — textes
