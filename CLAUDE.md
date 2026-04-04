# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**klyn / lavage-auto** — Plateforme de réservation de lavage automobile à domicile (sans eau). Trois rôles : CLIENT (réserve un lavage), LAVEUR (accepte et réalise les missions), ADMIN (back-office). Paiements via Stripe Checkout avec Connect pour les reversements aux laveurs.

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
- **Next.js** (App Router) + React 18 + TypeScript
- **Prisma** ORM → PostgreSQL (Supabase)
- **Supabase Auth** (SSR via `@supabase/ssr`) pour l'authentification
- **Stripe** Checkout + Connect pour les paiements et reversements
- **Tailwind CSS** pour le styling
- **Playwright** pour les tests d'intégration

### Structure du code (`src/`)

- `app/` — Routes Next.js App Router
  - `app/api/` — Route handlers REST organisés par domaine : `admin/`, `customer/`, `booking/`, `washer/`, `webhooks/stripe`
  - `app/admin/`, `app/dashboard/`, `app/reserver/`, `app/booking/` — Pages par rôle/fonctionnalité
- `components/` — Composants React (booking wizard, Dashboard, landing, Navigation)
- `contexts/AuthContext.tsx` — Provider d'authentification React (Supabase session + rôle DB)
- `lib/` — Couche logique partagée :
  - `supabase/` — Clients Supabase : `client.ts` (browser), `server.ts` (RSC/API), `admin.ts` (service role)
  - `auth/` — Guards par rôle : `adminGuard.ts`, `clientGuard.ts`, `washerGuard.ts` — pattern HOC (`withAdminGuard`) ou fonction directe (`checkAdminAuth`) pour les routes dynamiques
  - `actions/` — Server actions Stripe (payout, refund, washer-stripe onboarding)
  - `constants/services.ts` — Catalogue des services (source unique des prix en cents) + `TIME_SLOTS` (créneaux horaires partagés front/back)
  - `prisma.ts` — Singleton du client Prisma
  - `stripe.ts` — Client Stripe + helpers (createCheckoutSession)
  - `validation.ts`, `format.ts` — Utilitaires de validation et formatage
- `middleware.ts` — Protège les routes `/dashboard`, `/laveur`, `/admin`, `/onboarding`, `/reserver` ; exclut `/api` (les API gèrent leur propre auth via guards)

### Conventions Prisma
- Models : PascalCase singulier, tables : snake_case pluriel via `@@map`
- Fields : camelCase, mappés en snake_case via `@map`
- **Montants monétaires : toujours en centimes (Int)**. Ex: 25€ = 2500

### Modèle de données clé
- **User** : entité unique liée à Supabase Auth via `authId` (UUID). Rôle : CLIENT, LAVEUR, ADMIN
- **Profile** : 1:1 avec User. Pour les laveurs : SIRET, statut de validation (`VALIDATION_PENDING`/`VALIDATED`/`REJECTED`), Stripe Connect ID, rayon de travail, toggle disponibilité
- **Booking** : cycle de vie complet : `PENDING → CONFIRMED → ACCEPTED → EN_ROUTE → IN_PROGRESS → COMPLETED/CANCELLED`. Lie un client + laveur (nullable jusqu'à acceptation)
- **Payment** : 1:1 avec Booking. Suit session ID, payment intent, transfer ID, refund
- **Car** : véhicule client. Contrainte unique : `(userId, plate)`

### Authentification (double couche)
1. **Supabase Auth** : gère les sessions, tokens, OAuth
2. **Table `users` Prisma** : liée via `authId` (= Supabase Auth UUID). Le champ `role` (CLIENT/LAVEUR/ADMIN) détermine les autorisations côté API
3. Les API routes vérifient les deux : session Supabase + rôle en DB via les guards dans `lib/auth/`
4. **Guards** : deux patterns — HOC `withXxxGuard(handler)` pour routes simples, fonction `checkXxxAuth(request)` pour routes dynamiques avec params
5. **Laveurs** : sécurité fail-closed — le profil doit avoir `status = VALIDATED` pour accéder aux endpoints laveur

### Flux de paiement
- Prix définis dans `lib/constants/services.ts` (source de vérité unique)
- Stripe Checkout Session créé côté serveur → redirection client
- Webhook Stripe (`app/api/webhooks/stripe/`) met à jour le statut Payment/Booking
- Reversement laveur via Stripe Connect Transfer (actions dans `lib/actions/payout.ts`)

### Booking Wizard (`components/booking/`)
- Formulaire multi-étapes orchestré par `BookingWizard.tsx` : Service → Adresse → Créneau → Véhicule/Infos → Confirmation
- Persistance localStorage avec clé versionnée (`STORAGE_VERSION`) pour invalider les anciennes sessions entre déploiements
- Pré-remplissage automatique depuis `/api/customer/profile` (phone, firstName, lastName) et Supabase Auth metadata
- À la soumission (`booking/submit`) : le profil client (phone, nom) est upsert dans `profiles`, et un nouveau véhicule est créé dans `cars` (avec réutilisation si même plaque)
- Le `ReservationPopup` (landing hero) utilise les IDs canoniques de `services.ts` pour les liens vers `/reserver`

### Tests
- `tests/` — Tests Playwright (intégration API/booking flows)
- `src/__tests__/` — Tests unitaires (ex: cohérence des prix)
- Pas de framework de test unitaire configuré (vitest a été retiré) ; les tests unitaires existants utilisent les assertions de base

### Variables d'environnement requises
Voir `.env.example`. Clés principales :
- `DATABASE_URL`, `DIRECT_URL` (Prisma, le direct URL bypass PgBouncer pour les migrations)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`
