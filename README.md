# Nealkar — lavage-auto

Plateforme de réservation de **lavage automobile à domicile (sans eau)**. Les clients réservent un créneau, un laveur indépendant accepte la mission, réalise la prestation, et est payé automatiquement après validation par le client. La plateforme conserve une commission configurable (15 % par défaut).

## Rôles

- **CLIENT** — réserve un lavage via un wizard multi-étapes, enregistre sa carte (Setup Intent), valide le travail une fois terminé.
- **LAVEUR** — indépendant validé (SIRET + KYC Stripe Connect). Accepte des missions disponibles, renseigne des photos avant/après, est payé en net (brut − commission) par virement Stripe à la complétion.
- **ADMIN** — back-office : validation des laveurs, supervision des réservations et paiements, gestion du taux de commission plateforme.

## Stack

- **Next.js 16** (App Router) + React 18 + TypeScript strict
- **Prisma 6** → PostgreSQL (Supabase)
- **Supabase Auth** en SSR (`@supabase/ssr`)
- **Stripe** — Checkout en mode `setup` (carte enregistrée sans débit), capture manuelle différée à l'acceptation, Stripe Connect Express pour les reversements, commission snapshotée par mission
- **Tailwind CSS** (thème custom)
- **Playwright** pour les tests d'intégration/E2E

## Prérequis

- Node.js ≥ 18
- Compte Supabase (projet PostgreSQL + Auth)
- Compte Stripe avec Connect activé et un webhook configuré sur `POST /api/webhooks/stripe`

## Installation

```bash
git clone https://github.com/LeoLaborie/lavage-auto.git
cd lavage-auto
npm install
```

Créer un fichier `.env.local` à la racine :

```env
# Prisma (Supabase — pooler et connexion directe)
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Appliquer le schema Prisma :

```bash
npx prisma generate
npx prisma db push
```

Lancer le serveur :

```bash
npm run dev   # http://localhost:3000
```

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur Next.js en développement |
| `npm run build` | `prisma generate` + build production |
| `npm start` | Serveur Next.js en production (après build) |
| `npm run lint` | ESLint |
| `npx prisma generate` | Régénère le client Prisma |
| `npx prisma db push` | Synchronise le schema avec la base |
| `npx playwright test` | Lance les tests Playwright (démarre le dev server automatiquement) |

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── admin/         # Users, bookings, payments, settings/commission
│   │   ├── booking/       # submit, cancel, booked-slots, complete
│   │   ├── customer/      # profile, cars, bookings
│   │   ├── washer/        # missions, earnings, availability, photos
│   │   └── webhooks/stripe
│   ├── admin/ dashboard/ laveur/ reserver/ booking/
│   └── washer/stripe-callback/
├── components/
│   ├── booking/           # BookingWizard multi-étapes
│   ├── Dashboard/         # ClientDashboardView, WasherDashboardView, AdminDashboard
│   └── …
├── contexts/              # AuthContext (session Supabase), ToastContext
├── lib/
│   ├── supabase/          # client / server / admin
│   ├── auth/              # adminGuard, clientGuard, washerGuard
│   ├── actions/           # payout, refund, washer-stripe (onboarding)
│   ├── constants/         # services.ts (catalogue), commission.ts
│   ├── stripe.ts          # Helpers Stripe (setup/payment/connect)
│   └── prisma.ts
└── middleware.ts          # Protège /dashboard /laveur /admin /onboarding /reserver
```

Pour une description détaillée (conventions, flux de paiement, guards, webhooks), voir [`CLAUDE.md`](./CLAUDE.md).

## Modèle de données (résumé)

- `User` — lié à Supabase Auth via `authId`, champ `role` (CLIENT/LAVEUR/ADMIN)
- `Profile` — 1:1 avec User ; pour les laveurs : SIRET, statut de validation, `stripeAccountId` (Connect), `stripeAccountReady`, `stripeCustomerId`, rayon/adresse de travail
- `Booking` — cycle `PENDING → CONFIRMED → ACCEPTED → EN_ROUTE → IN_PROGRESS → COMPLETED/CANCELLED`
- `Payment` — 1:1 avec Booking ; montants en cents ; snapshot commission (`commissionCents`, `netAmountCents`, `commissionRate`) capturé au payout
- `PlatformSettings` — singleton contenant le taux de commission courant
- `Car`, `ContactMessage`

**Convention** : tous les montants sont en **centimes** (`Int`), tous les taux en `Decimal(5,4)`.

## Flux de paiement (Setup Intent différé)

1. Client termine le wizard → Booking `PENDING` + redirection Stripe Checkout mode `setup`.
2. Webhook `checkout.session.completed` → Booking `CONFIRMED` (carte enregistrée, **pas de débit**).
3. Un laveur accepte → débit off-session (PaymentIntent avec capture manuelle) → Booking `ACCEPTED`.
4. Laveur réalise la prestation (photos avant/après), client valide → Booking `COMPLETED`.
5. Payout : capture du PaymentIntent, calcul de la commission via `PlatformSettings.commissionRate`, transfer Stripe Connect du net au laveur, snapshot persisté sur le Payment.

## Tests

```bash
npx playwright test                              # Tous les tests
npx playwright test tests/booking-submit.spec.ts # Un fichier
npx playwright test tests/api/                   # Tests API uniquement
npx playwright test tests/e2e/                   # Tests E2E
```

## Contributing

1. Fork le repo, créer une branche (`feat/...` ou `fix/...`)
2. `npm run lint` + `npx playwright test` avant de pousser
3. Ouvrir une Pull Request en décrivant le changement

## License

Projet propriétaire — tous droits réservés.
