# Spec — Refonte des composants partagés (Cinétique)

**Issue GitHub :** #15
**Branche :** `feat/cinetique-shared-components`
**Date :** 2026-04-26

## Contexte

Suite au redesign Cinétique de la landing (`src/components/landing/*`, charte `docs/DESIGN.md`), les composants partagés non-landing utilisent encore les tokens Legacy (`primary`/`secondary`/`accent`, hex `#004aad`, polices et patterns hérités). Tant qu'ils ne sont pas alignés, toute page interne qui les importe restera incohérente avec la nouvelle direction artistique.

Ce ticket est **bloquant** pour la migration des écrans (issues #3-#14) — fixer ces composants partagés une seule fois cascade la cohérence Cinétique sur tout l'app.

## Décisions architecturales

### 1. Nav unique, plus de séparation landing/app

`NavCinetique` devient le **seul** composant de navigation. Il remplace `Header` partout (landing, login, réserver, contact, dashboards client/laveur).

**Rationale :** un seul composant = cohérence visuelle maximale + maintenance unique. Les différences entre contextes (visiteur/connecté, landing/interne) sont gérées en interne via `usePathname()` + `useAuth()`.

### 2. Détection automatique du contexte

La nav lit elle-même son contexte plutôt que de recevoir des props :
- `usePathname()` → masque les liens d'ancre Cinétique landing (`#how`, `#pricing`) hors `/`
- `usePathname()` → masque le bouton « Réserver » sur `/reserver` et `/login`
- `useAuth()` → bascule entre lien « Connexion » + CTA « Réserver » (visiteur) et avatar dropdown (connecté)

API d'utilisation : `<NavCinetique />` partout, sans prop.

### 3. Pas de hamburger mobile

La nav reste épurée sur mobile : logo + (avatar | bouton Réserver). Pas de drawer. YAGNI tant que la nav porte 1-2 actions seulement. Si plus tard on enrichit le menu connecté, on fera évoluer le dropdown en sheet bottom — pas avant.

### 4. `ReservationButton` reste un composant standalone

Le composant garde sa logique de purge `localStorage` (clés `booking_*`) avant redirection vers `/reserver`, refondu en tokens Cinétique. Réutilisable hors-nav (CTA inline dans des pages futures).

### 5. `TimeSelector` — port visuel pur

UX inchangée. Seuls les tokens (couleurs, polices, ombres, focus rings) sont migrés vers Cinétique.

## Livrables

### Composants modifiés

**`src/components/landing/NavCinetique.tsx`** — refactor pour gérer tous les contextes :
- Imports : `usePathname` (next/navigation), `useAuth` (@/contexts/AuthContext), `useUserRole` (nouveau hook), `ReservationButton`
- Sous-composant interne `UserMenu` : avatar + dropdown (tableau de bord + déconnexion). Gère `useState(open)`, `useRef(clickOutside)`, `useEffect(Escape)`. Pattern `aria-expanded`, `aria-haspopup="menu"`, `role="menu"`, `role="menuitem"`.
- Liens d'ancre `#how`/`#pricing` : rendus uniquement si `pathname === '/'`. Smooth scroll conservé via le helper local.
- Bouton « Réserver » : rendu uniquement si `pathname !== '/reserver' && pathname !== '/login'`. Utilise `<ReservationButton />`.
- Lien « Connexion » : visible uniquement si `!user && pathname !== '/login'`.
- Layout mobile : `md:hidden` masque le bloc de liens centraux et le lien Connexion. Avatar et bouton Réserver restent visibles en mobile (taille adaptée).
- Logo : conserve `/images/nealkar-logo.png` via `next/image`.

**`src/components/ReservationButton.tsx`** — refactor visuel :
- Conserve la logique `handleClick` (purge `booking_*` localStorage + `window.location.href = '/reserver'`).
- Variante par défaut : `rounded-[10px] bg-ink text-white px-4 py-2.5 md:px-[22px] md:py-[11px] font-cinsans text-sm font-semibold shadow-[0_4px_14px_rgba(10,28,92,0.3)] transition-transform hover:-translate-y-0.5`.
- Variante `isMobile` (CTA pleine largeur, pour usage hors nav) : `block w-full rounded-[10px] bg-ink py-3.5 font-cinsans text-sm font-semibold text-white shadow-[0_4px_14px_rgba(10,28,92,0.3)] text-center`.
- Plus de `border-2 border-primary`, plus de `bg-primary hover:bg-secondary`.

**`src/components/TimeSelector.tsx`** — port tokens (UX intacte) :
- Trigger button : `text-ink`, `bg-white shadow-cin-sm`, `focus:ring-blue`, `font-cinsans`.
- Icône calendrier + chevron : `text-ink`.
- Tile dates : couleurs neutres + `hover:bg-blue-wash hover:text-blue` + `selected:bg-ink text-white`.
- Slots horaires : non-sélectionné `bg-white border border-rule text-ink hover:bg-blue-wash hover:text-blue` ; sélectionné `bg-ink text-white`.
- Loader spinner : `border-b-2 border-ink`.
- Calendar custom CSS : `font-cinsans` à la place de `!font-sans`.

### Nouveau hook

**`src/lib/hooks/useUserRole.ts`** :
- Hook client. Reçoit `user` (Supabase user). Fait un `fetch('/api/auth/role')` quand `user` change.
- Retourne `{ role: 'CLIENT' | 'LAVEUR' | 'ADMIN' | null, dashboardUrl: string | null }`.
- Extraction du fetch role qui était inliné dans `Header.tsx`. Permet à `NavCinetique` de rester focalisé sur le rendu.

### Composants supprimés

- `src/components/Header.tsx`
- `src/components/Navigation/DesktopMenu.tsx`
- `src/components/Navigation/MobileMenu.tsx`
- Dossier `src/components/Navigation/` (devient vide)

### Pages à migrer (remplacer `<Header />` par `<NavCinetique />`)

- `src/app/login/page.tsx` — supprimer prop `currentPage="login"`.
- `src/app/reserver/page.tsx` — supprimer prop `currentPage="booking"`.
- `src/app/contact/page.tsx`
- `src/components/Dashboard/ClientDashboardView.tsx`
- `src/components/Dashboard/WasherDashboardView.tsx`

`src/app/page.tsx` (landing) déjà sur `NavCinetique` — no-op.

## Mappings de tokens

### `NavCinetique` (refactor)

| Avant (Legacy `Header`) | Après (Cinétique) |
|---|---|
| `bg-white/60 backdrop-blur-sm border-b border-secondary/20 shadow-lg` | `bg-[#ffffffea] backdrop-blur-[10px] border-b border-rule` |
| `h-20` (80px) | `var(--nav-h)` (64/70px) — déjà en place dans `NavCinetique` actuel |
| `border-2 border-primary text-primary` (Connexion) | `font-cinsans text-sm text-ink hover:text-blue` |
| `bg-gradient-to-br from-primary to-secondary` (avatar fallback) | `bg-ink text-white` |
| `focus:ring-primary` | `focus:ring-blue` |
| `max-w-7xl px-4 sm:px-6 lg:px-8` | `max-w-cin px-5 md:px-12` |

### `ReservationButton`

| Avant | Après |
|---|---|
| `bg-primary text-white px-6 py-2 rounded-lg hover:bg-secondary` | `rounded-[10px] bg-ink text-white px-4 py-2.5 md:px-[22px] md:py-[11px] font-cinsans text-sm font-semibold shadow-[0_4px_14px_rgba(10,28,92,0.3)] hover:-translate-y-0.5` |

### `TimeSelector`

| Avant | Après |
|---|---|
| `text-[#004aad]`, `text-primary` | `text-ink` |
| `bg-primary` (slot sélectionné) | `bg-ink text-white` |
| `hover:text-primary` | `hover:text-blue` |
| `border-b-2 border-primary` (spinner) | `border-b-2 border-ink` |
| `focus:ring-[#004aad]` / `focus:ring-primary` | `focus:ring-blue` |
| `bg-white/60 backdrop-blur-sm` (trigger) | `bg-white shadow-cin-sm` |
| Pas de `font-cinsans` | Ajouter `font-cinsans` aux textes |

## Risques et garde-fous

- **`usePathname()` peut retourner `null`** au premier render dans certains cas SSR. Fallback : si null, traiter comme `'/'` (pathname === landing). N'affecte que la première frame de la nav, négligeable.
- **`useAuth()` côté client** → `NavCinetique` doit rester `'use client'` (déjà le cas).
- **Layout shift** : la nav passe de 80 → 64-70px sur les pages qui utilisent `Header`. Auditer les `pt-20` / `top-20` / `mt-20` éventuels dans les pages migrées et les ajuster si besoin.
- **Asset logo Legacy `/nealkar.png`** : aucune autre référence dans `src/` (vérifié par grep). Safe à laisser ou nettoyer hors-scope.
- **A11y du dropdown** : reconduire les patterns du `DesktopMenu`/`MobileMenu` actuels (`role="menu"`, `role="menuitem"`, `aria-expanded`, focus return, Escape close, click outside). Pas de régression tolérée.
- **Tests Playwright** : aucune spec ne cible un selector spécifique au hamburger ou au menu mobile (vérifié par grep `Header|MobileMenu|DesktopMenu|ReservationButton` dans `tests/`). E2e devraient passer en l'état.

## Critères d'acceptation

- [ ] `Header.tsx`, `Navigation/DesktopMenu.tsx`, `Navigation/MobileMenu.tsx` supprimés (et dossier `Navigation/` retiré).
- [ ] `NavCinetique.tsx` gère les 4 contextes : landing visiteur, landing connecté, page interne visiteur, page interne connecté.
- [ ] `ReservationButton.tsx` et `TimeSelector.tsx` ne contiennent plus aucun token Legacy : `grep -rn "primary\|secondary\|#004aad" src/components/{ReservationButton.tsx,TimeSelector.tsx,landing/NavCinetique.tsx}` → 0 match.
- [ ] Les 5 pages consommatrices importent `NavCinetique` au lieu de `Header`.
- [ ] `npm run build` passe (TypeScript strict + Next compile).
- [ ] `npm run lint` passe sans nouveau warning.
- [ ] Tests Playwright e2e (`home`, `login`, `reserver`) passent.
- [ ] Smoke manuel via `npm run dev` :
  - Landing visiteur : ancres `#how`/`#pricing` scrollent avec offset `--nav-h`.
  - Landing connecté : avatar dropdown OK (tableau de bord + déconnexion).
  - `/login` : bouton « Réserver » caché, lien « Connexion » caché.
  - `/reserver` : bouton « Réserver » caché.
  - `/dashboard` : avatar dropdown OK, déconnexion redirige vers `/`.
  - Mobile (<768px) : pas de hamburger, layout propre, dropdown utilisateur fonctionnel.

## Hors-scope

- Refonte des dashboards eux-mêmes (couvert par issues #7).
- Refonte du `BookingWizard` (issue #4).
- Suppression de la palette Legacy de `tailwind.config.js` (à faire quand toutes les pages auront migré, pas avant).
- Ajout de nouveaux items au menu utilisateur (Profil, Paramètres, Notifications…) — YAGNI.
- Suppression de l'asset Legacy `/public/nealkar.png` — hors scope, traçable séparément.
