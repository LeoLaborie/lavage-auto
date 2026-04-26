# Cinétique Shared Components Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unifier la navigation et les composants partagés (`Header`, `Navigation/*`, `ReservationButton`, `TimeSelector`) sous un seul composant `NavCinetique` aligné avec la charte Cinétique de la landing.

**Architecture:** `NavCinetique` devient l'unique nav, détecte son contexte (page courante + état d'auth) via `usePathname()` + `useAuth()`. Pas de hamburger mobile. `ReservationButton` reste standalone refondu en tokens Cinétique. `TimeSelector` reçoit un port visuel pur.

**Tech Stack:** Next.js 16 App Router, React 18 client components, Tailwind CSS (palette Cinétique : `ink`, `blue`, `blue-electric`, `blue-wash`, `rule`, `max-w-cin`, `shadow-cin-*`), Supabase Auth via `useAuth()` hook.

**Spec source:** `docs/superpowers/specs/2026-04-26-cinetique-shared-components-design.md`

**GitHub issue:** #15

---

## File Structure

### Create
- `src/lib/hooks/useUserRole.ts` — hook client extrayant le fetch role + dashboardUrl

### Modify
- `src/components/landing/NavCinetique.tsx` — refactor complet (gère auth + pathname auto-détection, sous-composant interne `UserMenu`)
- `src/components/ReservationButton.tsx` — refactor visuel Cinétique, logique localStorage conservée
- `src/components/TimeSelector.tsx` — port tokens Legacy → Cinétique, UX inchangée
- `src/app/login/page.tsx` — remplace `<Header />` par `<NavCinetique />`
- `src/app/reserver/page.tsx` — idem
- `src/app/contact/page.tsx` — idem
- `src/components/Dashboard/ClientDashboardView.tsx` — idem (2 occurrences)
- `src/components/Dashboard/WasherDashboardView.tsx` — idem (2 occurrences)

### Delete
- `src/components/Header.tsx`
- `src/components/Navigation/DesktopMenu.tsx`
- `src/components/Navigation/MobileMenu.tsx`
- Dossier `src/components/Navigation/` (devient vide)

### Test / Verify (no unit framework — Playwright + lint + build)
- `npm run lint` doit passer
- `npm run build` doit passer (TypeScript strict + Next compile)
- `npx playwright test tests/e2e/home.spec.ts tests/e2e/login.spec.ts tests/e2e/reserver.spec.ts` doivent passer
- Smoke manuel via `npm run dev` (parcours documenté dans la dernière tâche)

---

## Task 1 — Créer le hook `useUserRole`

Extrait la logique de fetch role + dashboardUrl qui était inlinée dans `Header.tsx`. Permet à `NavCinetique` de rester focalisé sur le rendu.

**Files:**
- Create: `src/lib/hooks/useUserRole.ts`

- [ ] **Step 1: Créer le hook**

```typescript
// src/lib/hooks/useUserRole.ts
'use client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

type Role = 'CLIENT' | 'LAVEUR' | 'ADMIN' | null

export function useUserRole(user: User | null) {
  const [role, setRole] = useState<Role>(null)
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setRole(null)
      setDashboardUrl(null)
      return
    }

    let cancelled = false
    const fetchRole = async () => {
      try {
        const res = await fetch('/api/auth/role')
        if (!res.ok) return
        const data = await res.json()
        if (cancelled || !data.success || !data.data) return
        const r: Role = data.data.role ?? null
        setRole(r)
        if (r === 'CLIENT' || r === 'LAVEUR') {
          setDashboardUrl('/dashboard')
        } else if (r === 'ADMIN') {
          setDashboardUrl('/admin')
        } else {
          setDashboardUrl(null)
        }
      } catch (error) {
        console.error('useUserRole: failed to fetch role', error)
      }
    }
    fetchRole()
    return () => {
      cancelled = true
    }
  }, [user])

  return { role, dashboardUrl }
}
```

- [ ] **Step 2: Vérifier que TypeScript compile**

Run: `npx tsc --noEmit`
Expected: 0 errors related to this file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/hooks/useUserRole.ts
git commit -m "feat(hooks): extract useUserRole hook for role + dashboard URL fetching

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2 — Refactor `ReservationButton` en tokens Cinétique

Conserve la logique de purge `localStorage` (clés `booking_*`) + redirection vers `/reserver`. Migre uniquement le styling vers les tokens Cinétique.

**Files:**
- Modify: `src/components/ReservationButton.tsx` (rewrite complet — fichier de 28 lignes)

- [ ] **Step 1: Réécrire le composant**

Replace the entire content of `src/components/ReservationButton.tsx` with:

```tsx
'use client';

interface ReservationButtonProps {
  className?: string;
  isMobile?: boolean;
}

export default function ReservationButton({
  className = '',
  isMobile = false,
}: ReservationButtonProps) {
  const handleClick = () => {
    // Purge la session wizard pour repartir vierge
    localStorage.removeItem('booking_service');
    localStorage.removeItem('booking_date');
    localStorage.removeItem('booking_time');
    localStorage.removeItem('booking_address');
    localStorage.removeItem('booking_customer_info');
    localStorage.removeItem('booking_step');

    window.location.href = '/reserver';
  };

  const baseClasses =
    'rounded-[10px] bg-ink font-cinsans text-sm font-semibold text-white shadow-[0_4px_14px_rgba(10,28,92,0.3)] transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2';

  const variantClasses = isMobile
    ? 'block w-full py-3.5 text-center'
    : 'inline-block px-4 py-2.5 md:px-[22px] md:py-[11px]';

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {isMobile ? 'Réserver maintenant' : 'Réserver'}
    </button>
  );
}
```

- [ ] **Step 2: Vérifier qu'aucun token Legacy ne subsiste**

Run: `grep -nE "primary|secondary|accent|#004aad" src/components/ReservationButton.tsx`
Expected: 0 matches (no output).

- [ ] **Step 3: Vérifier compilation**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ReservationButton.tsx
git commit -m "refactor(ReservationButton): migrate to Cinétique tokens

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3 — Refactor `TimeSelector` en tokens Cinétique

Port visuel pur. UX et logique métier inchangées. Migre les couleurs, polices et focus rings.

**Files:**
- Modify: `src/components/TimeSelector.tsx`

- [ ] **Step 1: Migrer le bouton trigger**

In `src/components/TimeSelector.tsx`, replace the trigger button block (around lines 116-135):

Find:
```tsx
className="w-full pl-12 pr-6 py-4 rounded-lg bg-white/60 backdrop-blur-sm text-sm sm:text-lg text-[#004aad] focus:outline-none focus:ring-2 focus:ring-[#004aad] border-none shadow-md text-left flex justify-between items-center"
```

Replace with:
```tsx
className="w-full pl-12 pr-6 py-4 rounded-[10px] bg-white text-sm sm:text-lg text-ink font-cinsans focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 border border-rule shadow-cin-sm text-left flex justify-between items-center"
```

Then find the chevron SVG className:
```tsx
className={`w-5 h-5 text-[#004aad] transition-transform ${isOpen ? 'rotate-180' : ''}`}
```

Replace with:
```tsx
className={`w-5 h-5 text-ink transition-transform ${isOpen ? 'rotate-180' : ''}`}
```

Then find the calendar icon SVG className:
```tsx
className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#004aad]"
```

Replace with:
```tsx
className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink"
```

- [ ] **Step 2: Migrer le panneau dropdown et le calendar**

Find the dropdown container:
```tsx
className="absolute left-0 right-0 mt-2 z-50 bg-white rounded-lg shadow-xl border border-gray-100 p-4 animate-fade-in-up"
```

Replace with:
```tsx
className="absolute left-0 right-0 mt-2 z-50 bg-white rounded-[10px] shadow-cin-md border border-rule p-4 animate-fade-in-up"
```

Find the Calendar tile className prop:
```tsx
tileClassName="rounded-lg hover:bg-blue-50 focus:bg-blue-100"
```

Replace with:
```tsx
tileClassName="rounded-[8px] hover:bg-blue-wash focus:bg-blue-wash font-cinsans"
```

- [ ] **Step 3: Migrer la section horaires (label + spinner + grid + empty)**

Find the section "Horaires disponibles" header:
```tsx
<h4 className="text-sm font-semibold text-gray-500 mb-3">
  Horaires disponibles pour le {format(selectedDate, 'd MMMM', { locale: fr })}
</h4>
```

Replace with:
```tsx
<h4 className="text-sm font-cinsans font-semibold text-ink/70 mb-3">
  Horaires disponibles pour le {format(selectedDate, 'd MMMM', { locale: fr })}
</h4>
```

Find the spinner:
```tsx
<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
```

Replace with:
```tsx
<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ink"></div>
```

Find the slot button className:
```tsx
className={`px-2 py-2 text-sm rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${selectedTime === time
  ? 'bg-primary text-white'
  : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-primary'
  }`}
```

Replace with:
```tsx
className={`px-2 py-2 text-sm font-cinsans rounded-[8px] transition-colors focus:outline-none focus:ring-2 focus:ring-blue ${selectedTime === time
  ? 'bg-ink text-white'
  : 'bg-white border border-rule text-ink hover:bg-blue-wash hover:text-blue'
  }`}
```

Find the empty-state paragraph:
```tsx
<p className="text-sm text-red-500 text-center py-2">Aucun créneau disponible pour cette date.</p>
```

Replace with:
```tsx
<p className="text-sm font-cinsans text-red-600 text-center py-2">Aucun créneau disponible pour cette date.</p>
```

- [ ] **Step 4: Vérifier qu'aucun token Legacy ne subsiste**

Run: `grep -nE "text-primary|bg-primary|border-primary|focus:ring-primary|#004aad|hover:text-primary|hover:bg-primary" src/components/TimeSelector.tsx`
Expected: 0 matches.

- [ ] **Step 5: Vérifier compilation**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 6: Smoke visuel rapide**

Run: `npm run dev` (background)
Open: `http://localhost:3000/reserver` → étape `Quand ?` → ouvrir le `TimeSelector` → vérifier que les couleurs sont sobres (ink/blue/blue-wash), pas de bleu Legacy `#004aad`.
Stop dev server when done.

- [ ] **Step 7: Commit**

```bash
git add src/components/TimeSelector.tsx
git commit -m "refactor(TimeSelector): migrate to Cinétique tokens (UX preserved)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4 — Refactor `NavCinetique` pour gérer auth + auto-détection

La tâche centrale. `NavCinetique` devient l'unique nav, détecte son contexte via `usePathname()` et `useAuth()`. Inclut un sous-composant interne `UserMenu` pour le dropdown utilisateur connecté.

**Files:**
- Modify: `src/components/landing/NavCinetique.tsx` (rewrite complet)

- [ ] **Step 1: Réécrire `NavCinetique` avec gestion auth + pathname**

Replace the entire content of `src/components/landing/NavCinetique.tsx` with:

```tsx
'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useAuth } from '@/contexts/AuthContext'
import { useUserRole } from '@/lib/hooks/useUserRole'
import ReservationButton from '@/components/ReservationButton'

const landingLinks = [
  { href: '#how', label: 'Comment ça marche' },
  { href: '#pricing', label: 'Tarifs' },
]

export default function NavCinetique() {
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()
  const { dashboardUrl } = useUserRole(user)

  const isLanding = pathname === null || pathname === '/'
  const hideReserveCta = pathname === '/reserver' || pathname === '/login'
  const hideLoginLink = pathname === '/login'

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const target = document.querySelector(href)
    if (!target) return
    const navH = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--nav-h') || '0',
      10,
    )
    const top = target.getBoundingClientRect().top + window.scrollY - navH
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('NavCinetique: signOut failed', error)
    }
  }

  return (
    <header
      className="sticky top-0 z-30 border-b border-rule backdrop-blur-[10px]"
      style={{ background: '#ffffffea', height: 'var(--nav-h)' }}
    >
      <div className="mx-auto flex h-full max-w-cin items-center justify-between px-5 md:px-12">
        <Link href="/" className="shrink-0" aria-label="Nealkar — accueil">
          <Image
            src="/images/nealkar-logo.png"
            alt="Nealkar"
            width={1024}
            height={339}
            priority
            className="h-7 w-auto md:h-8"
          />
        </Link>

        {isLanding && (
          <nav className="hidden items-center gap-8 font-cinsans text-sm font-medium text-ink md:flex">
            {landingLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => handleSmoothScroll(e, l.href)}
                className="transition-colors hover:text-blue"
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-24 animate-pulse rounded-[10px] bg-rule" aria-hidden="true" />
          ) : user ? (
            <UserMenu user={user} dashboardUrl={dashboardUrl} onLogout={handleLogout} />
          ) : (
            !hideLoginLink && (
              <Link
                href="/login"
                className="hidden font-cinsans text-sm font-medium text-ink transition-colors hover:text-blue md:inline-block"
              >
                Connexion
              </Link>
            )
          )}
          {!hideReserveCta && <ReservationButton />}
        </div>
      </div>
    </header>
  )
}

interface UserMenuProps {
  user: User
  dashboardUrl: string | null
  onLogout: () => void | Promise<void>
}

function UserMenu({ user, dashboardUrl, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const profileImage: string | null = user.user_metadata?.avatar_url ?? null
  const displayName: string =
    (user.user_metadata?.name as string | undefined) ?? user.email ?? ''
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center rounded-full p-0.5 transition-colors hover:bg-rule/40 focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls="user-menu"
        aria-label="Menu utilisateur"
      >
        {profileImage ? (
          <img
            src={profileImage}
            alt=""
            className="h-9 w-9 rounded-full border border-rule object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-cinsans text-xs font-semibold text-white">
            {initials || '·'}
          </div>
        )}
      </button>

      {isOpen && (
        <div
          id="user-menu"
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-[10px] border border-rule bg-white py-2 shadow-cin-md"
        >
          <div className="border-b border-rule px-4 py-2" role="none">
            <p className="truncate font-cinsans text-sm font-medium text-ink" role="none">
              {(user.user_metadata?.name as string | undefined) ?? user.email}
            </p>
            <p className="truncate font-cinsans text-xs text-ink/60" role="none">
              {user.email}
            </p>
          </div>
          {dashboardUrl && (
            <Link
              href={dashboardUrl}
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 font-cinsans text-sm text-ink transition-colors hover:bg-blue-wash hover:text-blue focus:bg-blue-wash focus:outline-none"
            >
              Tableau de bord
            </Link>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false)
              void onLogout()
            }}
            className="block w-full px-4 py-2 text-left font-cinsans text-sm text-red-600 transition-colors hover:bg-red-50 focus:bg-red-50 focus:outline-none"
          >
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Vérifier compilation TypeScript**

Run: `npx tsc --noEmit`
Expected: 0 errors. (Si erreur sur `useAuth` types, vérifier que `signOut` y est bien exposé.)

- [ ] **Step 3: Vérifier qu'aucun token Legacy ne subsiste**

Run: `grep -nE "primary|secondary|accent|#004aad" src/components/landing/NavCinetique.tsx`
Expected: 0 matches.

- [ ] **Step 4: Smoke visuel — landing visiteur (déconnecté)**

Run: `npm run dev` (background)
Open: `http://localhost:3000/`
Vérifier :
- Logo Nealkar à gauche, lien `Connexion` + bouton noir `Réserver` à droite
- Liens `Comment ça marche` et `Tarifs` au centre (desktop ≥768px)
- Cliquer `Comment ça marche` → smooth scroll vers la section avec offset `--nav-h`
- Mobile (<768px) : pas de hamburger, juste logo + bouton `Réserver` (lien Connexion masqué)

Ne pas commit encore — la nav s'utilise sur d'autres pages, on commitera après le test sur tous les contextes (Step 5).

- [ ] **Step 5: Commit (la migration des pages suit dans les tâches suivantes)**

```bash
git add src/components/landing/NavCinetique.tsx
git commit -m "refactor(NavCinetique): unify nav with auto-detection + auth states

Adds usePathname/useAuth-driven branching for landing vs internal pages
and visitor vs authenticated users. Includes internal UserMenu component
(avatar dropdown with dashboard link + logout). Mobile layout has no
hamburger — logo + (avatar | reserve button) only.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5 — Migrer `src/app/login/page.tsx`

**Files:**
- Modify: `src/app/login/page.tsx:5,114`

- [ ] **Step 1: Remplacer l'import et l'usage**

In `src/app/login/page.tsx`:

Find line 5:
```tsx
import Header from '@/components/Header'
```

Replace with:
```tsx
import NavCinetique from '@/components/landing/NavCinetique'
```

Find line 114:
```tsx
<Header currentPage="login" />
```

Replace with:
```tsx
<NavCinetique />
```

- [ ] **Step 2: Vérifier compilation**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Smoke visuel `/login`**

Run: `npm run dev` (if not already)
Open: `http://localhost:3000/login`
Vérifier :
- Logo + nav Cinétique en haut
- Bouton `Réserver` masqué (on est sur `/login`)
- Lien `Connexion` masqué (on est sur `/login`)
- Pas de liens d'ancres (on n'est pas sur landing)

- [ ] **Step 4: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "refactor(login): migrate to NavCinetique

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6 — Migrer `src/app/reserver/page.tsx`

**Files:**
- Modify: `src/app/reserver/page.tsx:4,10`

- [ ] **Step 1: Remplacer l'import et l'usage**

In `src/app/reserver/page.tsx`:

Find line 4:
```tsx
import Header from '@/components/Header';
```

Replace with:
```tsx
import NavCinetique from '@/components/landing/NavCinetique';
```

Find line 10:
```tsx
<Header currentPage="booking" />
```

Replace with:
```tsx
<NavCinetique />
```

- [ ] **Step 2: Vérifier compilation**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Smoke visuel `/reserver`**

Open: `http://localhost:3000/reserver`
Vérifier :
- Bouton `Réserver` masqué (on est déjà sur `/reserver`)
- Lien `Connexion` visible si non connecté, avatar si connecté
- Cliquer le logo → retour landing OK

- [ ] **Step 4: Commit**

```bash
git add src/app/reserver/page.tsx
git commit -m "refactor(reserver): migrate to NavCinetique

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7 — Migrer `src/app/contact/page.tsx`

**Files:**
- Modify: `src/app/contact/page.tsx:4,67`

- [ ] **Step 1: Remplacer l'import et l'usage**

In `src/app/contact/page.tsx`:

Find line 4:
```tsx
import Header from '@/components/Header';
```

Replace with:
```tsx
import NavCinetique from '@/components/landing/NavCinetique';
```

Find line 67:
```tsx
<Header currentPage="contact" />
```

Replace with:
```tsx
<NavCinetique />
```

- [ ] **Step 2: Vérifier compilation**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Smoke visuel `/contact`**

Open: `http://localhost:3000/contact`
Vérifier :
- Nav Cinétique présente
- Bouton `Réserver` visible (on n'est ni sur `/reserver` ni sur `/login`)

- [ ] **Step 4: Commit**

```bash
git add src/app/contact/page.tsx
git commit -m "refactor(contact): migrate to NavCinetique

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8 — Migrer `ClientDashboardView`

**Files:**
- Modify: `src/components/Dashboard/ClientDashboardView.tsx:3,86,122` (2 usages)

- [ ] **Step 1: Remplacer l'import**

In `src/components/Dashboard/ClientDashboardView.tsx`:

Find line 3:
```tsx
import Header from '@/components/Header'
```

Replace with:
```tsx
import NavCinetique from '@/components/landing/NavCinetique'
```

- [ ] **Step 2: Remplacer les deux usages**

In `src/components/Dashboard/ClientDashboardView.tsx`:

Find line 86:
```tsx
<Header currentPage="dashboard" />
```

Replace with:
```tsx
<NavCinetique />
```

Find line 122:
```tsx
<Header currentPage="dashboard" />
```

Replace with:
```tsx
<NavCinetique />
```

(Both occurrences must be replaced — the page renders `<Header />` in two branches.)

- [ ] **Step 3: Auditer les offsets de layout**

Run: `grep -nE "pt-20|top-20|mt-20|h-20" src/components/Dashboard/ClientDashboardView.tsx src/app/dashboard/`
Expected: si des `pt-20` / `top-20` sont présents, ils sont dimensionnés pour l'ancien `Header` 80px. La nouvelle nav fait 64-70px. Si trouvé, ajuster en `pt-[var(--nav-h)]` (ou laisser `pt-16` si plus simple). **Si aucun match, OK pas d'ajustement.**

- [ ] **Step 4: Vérifier compilation**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Smoke visuel `/dashboard` (rôle CLIENT)**

Open: `http://localhost:3000/dashboard` (connecté en CLIENT)
Vérifier :
- Avatar utilisateur en haut à droite
- Cliquer avatar → dropdown avec `Tableau de bord` + `Se déconnecter`
- Pas de chevauchement entre la nav et le contenu (espacement OK)

- [ ] **Step 6: Commit**

```bash
git add src/components/Dashboard/ClientDashboardView.tsx
git commit -m "refactor(dashboard/client): migrate to NavCinetique

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9 — Migrer `WasherDashboardView`

**Files:**
- Modify: `src/components/Dashboard/WasherDashboardView.tsx:3,227,265` (2 usages)

- [ ] **Step 1: Remplacer l'import**

In `src/components/Dashboard/WasherDashboardView.tsx`:

Find line 3:
```tsx
import Header from '@/components/Header'
```

Replace with:
```tsx
import NavCinetique from '@/components/landing/NavCinetique'
```

- [ ] **Step 2: Remplacer les deux usages**

In `src/components/Dashboard/WasherDashboardView.tsx`:

Find line 227:
```tsx
<Header currentPage="dashboard" />
```

Replace with:
```tsx
<NavCinetique />
```

Find line 265:
```tsx
<Header currentPage="dashboard" />
```

Replace with:
```tsx
<NavCinetique />
```

- [ ] **Step 3: Auditer les offsets de layout**

Run: `grep -nE "pt-20|top-20|mt-20|h-20" src/components/Dashboard/WasherDashboardView.tsx`
Expected: si match, ajuster comme dans Task 8 Step 3.

- [ ] **Step 4: Vérifier compilation**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Smoke visuel `/dashboard` (rôle LAVEUR)**

Open: `http://localhost:3000/dashboard` (connecté en LAVEUR)
Vérifier :
- Avatar visible, dropdown OK
- Onglets Missions / Acceptées / Revenus cohérents avec la nav (pas de chevauchement)

- [ ] **Step 6: Commit**

```bash
git add src/components/Dashboard/WasherDashboardView.tsx
git commit -m "refactor(dashboard/washer): migrate to NavCinetique

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10 — Supprimer les composants Legacy

Maintenant que toutes les pages utilisent `NavCinetique`, on peut supprimer `Header`, `DesktopMenu`, `MobileMenu` en sécurité.

**Files:**
- Delete: `src/components/Header.tsx`
- Delete: `src/components/Navigation/DesktopMenu.tsx`
- Delete: `src/components/Navigation/MobileMenu.tsx`
- Delete (empty dir): `src/components/Navigation/`

- [ ] **Step 1: Vérifier qu'aucun import ne subsiste**

Run: `grep -rn "from.*['\"]@/components/Header['\"]\|from.*['\"]@/components/Navigation" src/`
Expected: 0 matches.

If any match found, **STOP** and migrate that consumer to `NavCinetique` before proceeding. Update this plan with the new consumer.

- [ ] **Step 2: Supprimer les fichiers**

Run:
```bash
rm src/components/Header.tsx
rm src/components/Navigation/DesktopMenu.tsx
rm src/components/Navigation/MobileMenu.tsx
rmdir src/components/Navigation
```

Expected: aucune erreur (tous les fichiers existent et le dossier devient vide).

- [ ] **Step 3: Vérifier compilation**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 4: Vérifier que le lint passe**

Run: `npm run lint`
Expected: aucun nouveau warning ou erreur.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(nav): remove legacy Header and Navigation components

All consumers now use NavCinetique. Header.tsx, Navigation/DesktopMenu.tsx,
and Navigation/MobileMenu.tsx are no longer referenced anywhere in src/.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11 — Vérifications finales et smoke complet

Vérifications globales pour clore l'issue #15.

- [ ] **Step 1: Audit tokens Legacy dans les composants ciblés**

Run:
```bash
grep -nE "primary|secondary|accent|#004aad" \
  src/components/landing/NavCinetique.tsx \
  src/components/ReservationButton.tsx \
  src/components/TimeSelector.tsx
```
Expected: 0 matches.

- [ ] **Step 2: Vérifier qu'il n'y a plus aucun usage de `Header` ou de `Navigation/`**

Run:
```bash
grep -rn "from.*['\"]@/components/Header['\"]\|from.*['\"]@/components/Navigation\|<Header\b" src/
```
Expected: 0 matches.

- [ ] **Step 3: Build complet**

Run: `npm run build`
Expected: build successful. (Inclut `prisma generate` + `next build`. Si erreur Prisma non liée au refactor, peut être ignorée si le build Next compile.)

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: pas de nouveau warning par rapport au baseline.

- [ ] **Step 5: Tests Playwright e2e**

Run: `npx playwright test tests/e2e/home.spec.ts tests/e2e/login.spec.ts tests/e2e/reserver.spec.ts`
Expected: tous les tests passent. Si un test échoue parce qu'il cible un selector du legacy header (ex. hamburger button), corriger le test pour cibler la nouvelle nav (`<header>` Cinétique).

- [ ] **Step 6: Smoke browser complet**

Run: `npm run dev` (background)

Parcours à valider :

| URL | Auth | À vérifier |
|---|---|---|
| `/` | déconnecté | logo + ancres `#how`/`#pricing` (desktop) + lien `Connexion` + bouton `Réserver`. Mobile : pas de hamburger, juste logo + bouton `Réserver`. |
| `/` | connecté | ancres OK + avatar à droite. Dropdown : tableau de bord + déconnexion. |
| `/login` | déconnecté | bouton `Réserver` ET lien `Connexion` cachés. Pas d'ancres. |
| `/reserver` | déconnecté ou connecté | bouton `Réserver` caché. Avatar/lien Connexion selon auth. Pas d'ancres. |
| `/contact` | déconnecté | nav Cinétique standard. Pas d'ancres. |
| `/dashboard` | connecté CLIENT | avatar dropdown OK. `Tableau de bord` mène à `/dashboard`. Déconnexion redirige bien. |
| `/dashboard` | connecté LAVEUR | idem CLIENT. |
| Mobile (<768px) | tous contextes | pas de hamburger nulle part. Avatar accessible au tap. Dropdown s'ouvre dans la zone visible. |

Stop dev server après validation.

- [ ] **Step 7: Vérifier l'a11y du dropdown utilisateur**

Tester clavier (sans souris) sur `/dashboard` :
- Tab jusqu'à l'avatar → bouton focusable visible (`focus:ring-blue`)
- Enter → dropdown s'ouvre
- Escape → dropdown se ferme
- Click outside → dropdown se ferme

Si l'un échoue, revenir au Task 4 et reprendre l'implémentation de `UserMenu`.

- [ ] **Step 8: Push et préparer la PR**

```bash
git push -u origin feat/cinetique-shared-components
gh pr create --title "feat(nav): unify shared components under Cinétique design (#15)" --body "$(cat <<'EOF'
## Summary
- Replace Header + Navigation/DesktopMenu + Navigation/MobileMenu with single NavCinetique component
- NavCinetique now auto-detects context via usePathname() + useAuth()
- ReservationButton refactored to Cinétique tokens (localStorage purge logic preserved)
- TimeSelector visual port to Cinétique tokens (UX unchanged)
- New useUserRole hook extracts role + dashboardUrl fetch logic
- All 5 consumer pages migrated (login, reserver, contact, ClientDashboardView, WasherDashboardView)

Closes #15.

## Test plan
- [ ] npm run build passes
- [ ] npm run lint passes
- [ ] npx playwright test tests/e2e/{home,login,reserver}.spec.ts passes
- [ ] Smoke manual: 8 URL/auth combinations from spec checklist
- [ ] A11y manual: keyboard nav on user dropdown (Tab, Enter, Escape, click outside)

## Notes
- Mobile hamburger removed (YAGNI — nav has 1-2 actions only)
- Legacy /nealkar.png asset left in place (no consumers in src/), can be cleaned up separately
- tailwind.config.js Legacy palette kept (still used by other unmigrated pages — issues #3-#14)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Note: la PR doit citer #15 pour fermeture auto. Adapter le titre/body si la convention du repo diffère.

---

## Self-Review (effectué par l'auteur du plan)

- ✅ **Spec coverage** : tous les composants du spec sont couverts (NavCinetique Task 4, ReservationButton Task 2, TimeSelector Task 3, useUserRole Task 1, suppressions Task 10). Toutes les pages consommatrices listées dans le spec ont leur tâche (Tasks 5-9).
- ✅ **Placeholder scan** : aucun TBD/TODO. Tous les blocs de code sont complets.
- ✅ **Type consistency** : `useUserRole` retourne `{ role, dashboardUrl }` — utilisé dans NavCinetique (`dashboardUrl` extrait, `role` ignoré pour l'instant — c'est OK, on l'expose pour usages futurs sans complexifier la nav). `UserMenu` reçoit `User` (Supabase type) cohérent avec ce qu'expose `useAuth()`.
- ✅ **Critères d'acceptation du spec** : tous reflétés dans Task 11.
- ✅ **Risques du spec** :
  - `usePathname()` null fallback → géré (Task 4 Step 1, ligne `pathname === null || pathname === '/'`)
  - Layout shift 80→64-70px → audit explicite (Task 8 Step 3, Task 9 Step 3)
  - A11y dropdown → vérification dédiée (Task 11 Step 7)
  - Tests Playwright fragiles → instruction de correction (Task 11 Step 5)
