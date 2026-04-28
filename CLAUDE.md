# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nealkar / lavage-auto** — Plateforme de réservation de lavage automobile à domicile (sans eau). Trois rôles : CLIENT (réserve un lavage), LAVEUR (accepte et réalise les missions), ADMIN (back-office). Paiements via Stripe (Setup Intent + capture manuelle) avec Connect Express pour les reversements aux laveurs, commission plateforme configurable (15 % par défaut).

## Commands

```bash
npm run dev          # Serveur de développement (http://localhost:3000)
npm run build        # Build production (exécute prisma generate + next build)
npm run lint         # ESLint
npx prisma generate  # Régénérer le client Prisma après modification du schema
npx prisma db push   # Appliquer le schema à la base de données
npx playwright test  # Tests d'intégration Playwright (lance le dev server automatiquement)
npx playwright test tests/booking-submit.spec.ts  # Un seul fichier de test
```

## Architecture

### Stack
- **Next.js 16** (App Router) + React 18 + TypeScript (strict)
- **Prisma 6** ORM → PostgreSQL (Supabase)
- **Supabase Auth** (SSR via `@supabase/ssr`) pour l'authentification
- **Stripe** (API `2025-02-24.acacia`) : Checkout en mode `setup`, capture manuelle, Connect Express pour les reversements
- **Tailwind CSS** : double palette — Cinétique (`ink`, `blue`, `blue-electric`, `blue-wash`, `rule`, `max-w-cin`, `shadow-cin-*`) pour la landing redesign, Legacy (`primary`/`secondary`/`accent`, font `Intro Rust`) pour dashboards et pages internes
- **Polices** : Inter Tight (`font-display`), Inter (`font-cinsans`), JetBrains Mono (`font-mono`) chargées via `next/font/google` dans `app/layout.tsx`
- **Playwright** pour les tests d'intégration et E2E

### Structure du code (`src/`)

- `app/` — Routes Next.js App Router
  - `app/api/` — Route handlers REST organisés par domaine :
    - `admin/` — gestion utilisateurs, bookings, paiements, `settings/commission` (GET/PATCH taux plateforme)
    - `customer/` — profil, véhicules, bookings client
    - `booking/` — submit, cancel, `booked-slots`, complete, `validate-timeslot`
    - `washer/` — missions `available`/`accepted`/`accept`, `earnings`, `availability`, photos & status par mission
    - `auth/` — `create-profile`, `role`
    - `contact/` — formulaire de contact
    - `webhooks/stripe/` — événements Stripe
  - `app/admin/`, `app/dashboard/` (client), `app/reserver/`, `app/booking/` — Pages par rôle/fonctionnalité
  - `app/washer/stripe-callback/` — retour d'onboarding Stripe Connect
- `components/` — Composants React :
  - `booking/` — `BookingWizard.tsx` + `StepService`/`StepAddress`/`StepSchedule`/`StepVehicle`/`StepConfirmation`
  - `Dashboard/` — `ClientDashboardView`, `WasherDashboardView`, `AdminDashboard`
  - `features/admin/`, `features/laveur/`, `features/dashboard/` — widgets par rôle
  - `landing/` — Composants de la landing Cinétique : `NavCinetique`, `HeroCinetique`, `IsometricCar`, `TickerCinetique`, `HowItWorksCinetique`, `BeforeAfterCinetique`, `LaveursCinetique`, `PricingCinetique`, `CtaCinetique`, `FooterCinetique`, `Wordmark`. Lecture obligatoire avant tout changement UI : `docs/DESIGN.md` (charte graphique complète)
  - `Navigation/`, `Header`, `ReservationPopup`, `TimeSelector`, `AddressAutocomplete`, UI primitives
- `contexts/` — `AuthContext.tsx` (session Supabase uniquement, **pas** le rôle DB — lu côté serveur via les guards), `ToastContext.tsx`
- `lib/` — Couche logique partagée :
  - `hooks/` — Hooks React : `useScrollProgress` (animation scroll-driven du hero Cinétique)
  - `supabase/` — `client.ts` (browser), `server.ts` (RSC/API), `admin.ts` (service role)
  - `auth/` — Guards par rôle : `adminGuard.ts`, `clientGuard.ts`, `washerGuard.ts` — pattern HOC (`withAdminGuard`) ou fonction directe (`checkAdminAuth`) pour les routes dynamiques
  - `actions/` — Server actions Stripe : `payout.ts` (capture + transfer + snapshot commission), `refund.ts`, `washer-stripe.ts` (onboarding Connect)
  - `constants/services.ts` — Catalogue des services (source unique des prix en cents) + `TIME_SLOTS` + flag `isVisible`
  - `constants/commission.ts` — `getCurrentCommissionRate()` (seed idempotent de `PlatformSettings`) + `computeCommission()`
  - `prisma.ts` — Singleton du client Prisma
  - `stripe.ts` — Client Stripe + helpers : `createSetupCheckoutSession`, `createCheckoutSession` (legacy), `getOrCreateStripeCustomer`, `chargeCustomer` (off-session), `createConnectAccount`, `createAccountLink`, `capturePaymentIntent`, `createTransfer`
  - `validation.ts`, `format.ts`, `utils/storage.ts`
- `middleware.ts` — Protège les routes `/dashboard`, `/laveur`, `/admin`, `/onboarding`, `/reserver` ; exclut `/api` (les API gèrent leur propre auth via guards)

### Conventions Prisma
- Models : PascalCase singulier, tables : snake_case pluriel via `@@map`
- Fields : camelCase, mappés en snake_case via `@map`
- **Montants monétaires : toujours en centimes (Int)**. Ex: 25€ = 2500
- Taux (commission) : `Decimal(5, 4)` (ex. `0.1500` = 15 %)

### Modèle de données clé
- **User** : entité unique liée à Supabase Auth via `authId` (UUID). Rôle : CLIENT, LAVEUR, ADMIN
- **Profile** : 1:1 avec User. Champs communs (`firstName`, `lastName`, `phone`). Pour les laveurs : `siret`, `companyName`, `status` (`VALIDATION_PENDING`/`VALIDATED`/`REJECTED`), `stripeAccountId` (Connect), `stripeAccountReady` (bool synchronisé via webhook `account.updated` — `charges_enabled && payouts_enabled && details_submitted`), `stripeCustomerId` (Customer pour Setup Intent), `workRadius`, `workAddress`, `isAvailable`
- **Booking** : cycle de vie `PENDING → CONFIRMED → ACCEPTED → EN_ROUTE → IN_PROGRESS → AWAITING_REVIEW → COMPLETED/CANCELLED`. Le passage en `AWAITING_REVIEW` est déclenché par le laveur (avec photos avant/après obligatoires) ; le client a 24 h pour valider via `POST /api/booking/[id]/complete` ou contester. Sans réponse, un cron `pg_cron` horaire passe le booking en `COMPLETED` automatiquement (cf. `supabase/cron.sql`). Champs photos `beforePhotoUrl`/`afterPhotoUrl`, `cancellationReason`, horodatages (`startedAt`, `completedAt`, `validatedAt`, `awaitingReviewSince`).
- **Payment** : 1:1 avec Booking. Suit `stripeSessionId`, `stripePaymentIntentId`, `stripeTransferId`. **Snapshot commission** (renseigné au payout) : `commissionCents`, `netAmountCents`, `commissionRate` — nullable pour les lignes antérieures à l'introduction de la commission. Suivi refund (`refundAmountCents`, `refundedAt`, `refundReason`) et payout (`paidOutAt`, `processedAt`)
- **PayoutAttempt** : audit trail de chaque appel à `triggerPayout()` (succès et échecs). Champs : `bookingId`, `attemptedAt`, `triggeredBy` (`'client' | 'cron' | 'admin'`), `success`, `errorCode`, `errorMessage`. Vue admin via `GET /api/admin/payouts/failures` qui agrège par booking, dernier essai en date.
- **PlatformSettings** : singleton, `commissionRate` (Decimal 5,4, défaut `0.1500`), `updatedByUserId`. Accédé via `getCurrentCommissionRate()` (seed idempotent)
- **Car** : véhicule client. Contrainte unique : `(userId, plate)`
- **ContactMessage** : soumissions du formulaire de contact

### Authentification (double couche)
1. **Supabase Auth** : gère les sessions, tokens, OAuth. `AuthContext` côté client n'expose **que** la session (pas de rôle).
2. **Table `users` Prisma** : liée via `authId` (= Supabase Auth UUID). Le champ `role` (CLIENT/LAVEUR/ADMIN) détermine les autorisations **côté serveur**, jamais exposé au client via contexte.
3. Les API routes vérifient les deux : session Supabase + rôle en DB via les guards dans `lib/auth/`
4. **Guards** : deux patterns — HOC `withXxxGuard(handler)` pour routes simples, fonction `checkXxxAuth(request)` pour routes dynamiques avec params. Retour type : `{ ok: true, authUser, dbUser }` ou `{ ok: false, response: NextResponse }`
5. **Laveurs** : sécurité fail-closed — le profil doit avoir `status = VALIDATED` pour accéder aux endpoints laveur. Pour accepter une mission, `stripeAccountReady = true` est requis en plus.

### Flux de paiement (Setup Intent différé)
Flux principal actuel (les helpers `createCheckoutSession` / mode `payment` restent disponibles pour compatibilité, mais ne sont plus le chemin par défaut) :

1. **Réservation** : le client termine le wizard → création d'un `Booking` en `PENDING` + d'un `Payment` en `PENDING`.
2. **Setup Checkout** : redirection vers Stripe Checkout en mode `setup` (carte validée et enregistrée **sans débit**). Webhook `checkout.session.completed` fait passer le `Booking` en `CONFIRMED` (transition idempotente).
3. **Acceptation par un laveur** : `POST /api/washer/missions/accept` — guard laveur + vérification `stripeAccountReady`. Débit off-session via `chargeCustomer()` (PaymentIntent avec `confirm: true`, `off_session: true`, `capture_method: manual`, idempotency key `booking-{id}-charge`). Le `payment_method` est explicitement récupéré depuis le Customer avant le charge. Booking → `ACCEPTED`.
4. **Complétion** : lifecycle laveur `EN_ROUTE` → `IN_PROGRESS` → photos avant/après uploadées. Le client valide via `POST /api/booking/[id]/complete` → `COMPLETED`.
5. **Payout** (`lib/actions/payout.ts`) : déclenché à la complétion. Garde-fous :
   - Booking doit être `COMPLETED`, laveur doit avoir `stripeAccountId` + `stripeAccountReady`
   - PaymentIntent doit exister (gère à la fois `requires_capture` legacy et `succeeded` déjà capturé)
   - Calcul commission via `computeCommission(amountCents, currentRate)` — ajustement arrondi absorbé par le net pour garantir `net + commission === gross`
   - `capturePaymentIntent()` si encore en escrow, puis `createTransfer(netAmount, stripeAccountId, chargeId, bookingId)` vers le laveur (idempotency key `booking-{id}-transfer`, `source_transaction` = Charge ID, **pas** PaymentIntent ID)
   - Snapshot persisté sur `Payment` : `commissionCents`, `netAmountCents`, `commissionRate`, `stripeTransferId`, `paidOutAt`
6. **Commission plateforme** : taux global dans `PlatformSettings`. L'admin peut le modifier via `PATCH /api/admin/settings/commission` (validation 0 ≤ rate ≤ 1). Le taux est **snapshoté** sur chaque Payment au moment du payout, donc les modifications n'impactent que les futures missions.

7. **Auto-complétion et déclenchement payout** :
   - Le laveur peut signaler la fin de mission via `PATCH /api/washer/missions/[id]/status` avec `{ status: 'AWAITING_REVIEW' }` (photos avant + après obligatoires, flag `WASHER_CAN_FINISH=true` requis). Le booking entre en `AWAITING_REVIEW`, `awaitingReviewSince = NOW()`.
   - Le client valide ou conteste sous 24 h. Validation client → `POST /api/booking/[id]/complete` → `triggerPayout()`.
   - Sans validation, le cron Supabase `pg_cron` (`supabase/cron.sql`, fréquence horaire) appelle `POST /api/cron/auto-complete` qui passe les bookings `AWAITING_REVIEW > 24h` en `COMPLETED` et déclenche le payout. Il rattrape aussi les bookings legacy bloqués en `IN_PROGRESS > 7 jours` qui ont une photo après (preuve photo).
   - Chaque appel à `triggerPayout()` (succès ou échec) écrit une ligne dans `PayoutAttempt`.

### Onboarding Stripe Connect (laveurs)
- `startStripeOnboarding()` (`lib/actions/washer-stripe.ts`) : crée un compte Express si absent, gère les comptes orphelins (account IDs stale, clés rotées) via validation préalable auto-récupérative, puis génère un Account Link
- Retour utilisateur sur `/washer/stripe-callback` (page dynamique)
- Le webhook `account.updated` met à jour `stripeAccountReady` dès que les capacités `charges_enabled`, `payouts_enabled` et `details_submitted` sont toutes vraies
- Tant que `stripeAccountReady = false`, les endpoints d'acceptation de mission refusent

### Webhooks Stripe (`app/api/webhooks/stripe/route.ts`)
Événements gérés :
- `checkout.session.completed` : mode `setup` (flux principal) et `payment` (legacy) — transition `PENDING → CONFIRMED` **idempotente**, upsert `Payment` en mode payment
- `payment_intent.payment_failed` : marquage pour suivi côté dashboard
- `account.updated` : sync `Profile.stripeAccountReady`

### Booking Wizard (`components/booking/`)
- Formulaire multi-étapes orchestré par `BookingWizard.tsx` : Service → Adresse → Créneau → Véhicule/Infos → Confirmation
- Persistance localStorage avec clé versionnée (`STORAGE_VERSION`) pour invalider les anciennes sessions entre déploiements
- Pré-remplissage automatique depuis `/api/customer/profile` (phone, firstName, lastName) et Supabase Auth metadata
- À la soumission (`POST /api/booking/submit`, guard client) :
  - Validation : service visible, date future, format créneau, longueur adresse
  - **Rate limit** : refus si dernière création < 10 s
  - **Cap** : max 10 bookings actifs (PENDING/CONFIRMED/ACCEPTED) par client
  - Upsert Profile (firstName, lastName, phone, email)
  - Upsert Car (réutilisation si même `(userId, plate)`)
  - Création Booking `PENDING` + Setup Checkout → redirection Stripe
- Le `ReservationPopup` (landing hero) utilise les IDs canoniques de `services.ts` pour les liens vers `/reserver`
- **Disponibilité des créneaux** : validation per-client (un même client ne peut pas réserver 2× le même créneau). `GET /api/booking/booked-slots?date=YYYY-MM-DD` retourne les créneaux déjà pris par le client ; `StepSchedule` et `TimeSelector` les masquent

### Dashboards
- **Client** (`ClientDashboardView`) : liste des bookings (à venir / terminés / annulés), gestion véhicules, validation après complétion laveur, annulation
- **Laveur** (`WasherDashboardView`) : onglets Missions disponibles / Missions acceptées / Revenus. Chaque mission affiche le brut, le net et la commission snapshotée (ou prévisionnelle via le taux courant pour les missions non encore payées). Upload photos avant/après. Toggle `isAvailable` via `PATCH /api/washer/availability`. Earnings via `GET /api/washer/earnings` : `validatedEarningsCents`, `pendingEarningsCents`, `upcomingEarningsCents`, `totalCommissionCents`, `currentCommissionRate`.
- **Admin** (`AdminDashboard`) : validation/rejet des profils laveurs (`VALIDATION_PENDING → VALIDATED/REJECTED`), vue paiements, gestion du taux de commission plateforme (GET/PATCH `/api/admin/settings/commission`), refund via `/api/admin/payments`

### Tests
- `tests/` — Tests Playwright répartis en :
  - Racine : `booking-submit`, `booking-management`, `booking-date-location`
  - `tests/booking/` — `catalog` (cohérence catalogue services)
  - `tests/api/` — `booking`, `booking-complete`, `customer`, `washer`, `photos`, `payout`, `admin`, `admin-refund`, `stripe-webhooks`, `booking-awaiting-review`, `cron-auto-complete`, `payout-attempt`
  - `tests/e2e/` — `home`, `login`, `reserver`
- `playwright.config.ts` lance `npm run dev` automatiquement (`reuseExistingServer` en local)
- Pas de framework de test unitaire configuré (vitest a été retiré)

### Landing Cinétique (design system)
- **Charte graphique complète** : `docs/DESIGN.md` — couleurs, typographie, layout, ombres, composants types, animations, voix éditoriale. **À consulter avant toute modification UI sur la landing.**
- **Direction artistique** : Cinétique (éditoriale, contrastée, typographique, accents bleus électriques). Ne pas mélanger avec les tokens Legacy.
- **Conteneur** : `max-w-cin` (1320px), `px-5 md:px-12`, `py-16 md:py-[120px]`
- **Variable CSS** `--nav-h` (64px mobile, 70px desktop) pour tous les offsets sticky / smooth scroll. Référencer cette variable, jamais coder en dur.
- **Smooth scroll** sur ancres : pattern unifié dans Nav, Footer, Hero — `getBoundingClientRect().top + window.scrollY - navH`
- **Pas de hardcoded metrics** non vérifiables (notes moyennes, nombre de laveurs en ligne) — n'afficher que des engagements vérifiables (KYC, support 24/7, sans eau, < 24h)
- **Source de vérité prix** : `lib/constants/services.ts` (filtré par `isVisible`) — `PricingCinetique` lit ce catalogue, jamais de prix hardcodés ailleurs
- **Piège connu** : les italiques en `background-clip: text` clippent les glyphes débordants (`?`, `j`...). Toujours envelopper dans `inline-block` + `padding-right: 0.25em`

### Variables d'environnement requises
Configurées dans `.env.local` (pas de `.env.example` committed). Clés principales :
- `DATABASE_URL`, `DIRECT_URL` (Prisma ; `DIRECT_URL` bypasse PgBouncer pour `prisma db push`/migrations)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (pour `lib/supabase/admin.ts`)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL` (URLs de callback Stripe)
- `CRON_SECRET` : secret 256 bits (`openssl rand -hex 32`) partagé avec Supabase Vault sous la clé `cron_secret`. Protège l'endpoint `/api/cron/auto-complete`.
- `WASHER_CAN_FINISH` : flag de feature (`'true'` pour activer la transition `IN_PROGRESS → AWAITING_REVIEW` côté laveur). Permet de canary la fonctionnalité sans rollback.
