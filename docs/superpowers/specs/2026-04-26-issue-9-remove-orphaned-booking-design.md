# Spec — Issue #9 : Suppression de la page `/booking` orpheline

**Date** : 2026-04-26
**Issue GitHub** : [#9 — [Cinétique] Migrer la page Booking / Detail (P2)](https://github.com/leo-laborie/lavage-auto/issues/9)
**Type** : `chore` (suppression de code mort) — substitut à la migration design demandée
**Branche cible** : `chore/issue-9-remove-orphaned-booking`
**Worktree** : `.worktrees/booking-cleanup`

---

## 1. Contexte

L'issue #9 demande la migration de `src/app/booking/page.tsx` vers la charte Cinétique (remplacer `bg-slate-50`, appliquer `max-w-cin`, `font-display`, etc.).

L'audit du code révèle que la page est **orpheline et fonctionnellement cassée** :

- **Aucune entrée utilisateur** : `grep` exhaustif sur `src/` → aucun `<Link href="/booking">` ni `router.push('/booking')`. Les seuls usages de `/booking` dans le code sont :
  - `src/lib/stripe.ts:63,96` → `success_url: ${baseUrl}/booking/success?bookingId=...` (callback Stripe, pointe vers `/booking/success`, **pas** la racine).
  - `src/components/Dashboard/ClientDashboardView.tsx:64` et `AdminDashboard.tsx:248,455` → routes API `/api/customer/bookings/*` et `/admin/bookings/*` (sans rapport).
- **Bouton cassé** : `ServiceCatalog.handleContinue` redirige vers `/booking/location?serviceId=...` (`ServiceCatalog.tsx:18`). La route `/booking/location` **n'existe pas** dans `src/app/`.
- **Flux réel** : la réservation de production passe par `/reserver` via `components/booking/BookingWizard.tsx`, lui-même atteint depuis le hero (`ReservationPopup`) et la nav.
- **Aucun test** : `grep` sur `tests/` → zéro référence à `ServiceCard` ou `ServiceCatalog`.

La page est un vestige antérieur à `BookingWizard`, jamais retiré. Repeindre du code mort en Cinétique consomme du diff sans bénéfice utilisateur.

## 2. Décision

Substituer à la migration cosmétique une **suppression complète** de la page et de ses composants exclusifs. L'issue #9 sera close avec la justification de cet audit.

## 3. Périmètre

### 3.1 Fichiers supprimés

| Chemin | Lignes | Justification |
|---|---|---|
| `src/app/booking/page.tsx` | 16 | Page orpheline, route racine `/booking` non liée |
| `src/components/features/booking/ServiceCatalog.tsx` | 65 | Importé uniquement par `page.tsx` ci-dessus |
| `src/components/features/booking/ServiceCard.tsx` | 56 | Importé uniquement par `ServiceCatalog.tsx` ci-dessus |

Le dossier `src/components/features/booking/` devient vide → suppression du dossier également.

### 3.2 Fichiers explicitement conservés (vérifiés indépendants)

- `src/app/booking/success/page.tsx` — page de succès Stripe ; importée indirectement via `lib/stripe.ts` (`success_url`). N'importe ni `ServiceCatalog` ni `ServiceCard`.
- `src/components/booking/` (sans `features/`) — `BookingWizard.tsx` et ses StepX ; flux de réservation actif.
- `src/lib/constants/services.ts` — catalogue services consommé par `BookingWizard`, `PricingCinetique`, `ReservationPopup`.
- `src/components/features/admin/` et `src/components/features/laveur/` et `src/components/features/dashboard/` — autres dossiers `features/` inchangés.

### 3.3 Hors scope

- Aucune modification à la palette ou aux tokens Tailwind.
- Aucune migration UI sur d'autres pages (les autres issues `design-migration` continuent indépendamment).
- Aucune refonte de `BookingWizard` ou du catalogue services.

## 4. Comportement après suppression

- `GET /booking` → **404** Next.js (au lieu d'afficher une page avec un bouton cassé). Comportement plus propre.
- `GET /booking/success?bookingId=...` → inchangé, retourne la page de confirmation.
- `GET /reserver` → inchangé, BookingWizard fonctionnel.
- Tous les flux de Stripe (Setup Checkout `success_url`) restent intacts.

## 5. Critères d'acceptation

- [ ] Les trois fichiers listés en 3.1 sont supprimés.
- [ ] Le dossier `src/components/features/booking/` n'existe plus.
- [ ] `npm run build` passe (Prisma generate + Next.js build).
- [ ] `npm run lint` ne signale aucune nouvelle erreur.
- [ ] `grep -rn "features/booking\|ServiceCatalog\|ServiceCard" src/` retourne 0 résultat.
- [ ] Smoke test manuel : `/reserver` charge le wizard ; `/booking/success?bookingId=<id-existant>` charge la confirmation ; `/booking` retourne 404.
- [ ] Critère d'acceptation original de l'issue #9 (« Aucun token Tailwind brut hors palette Cinétique ») trivialement satisfait : les fichiers concernés n'existent plus.

## 6. Plan de mise en œuvre (haut niveau)

1. Créer worktree `.worktrees/booking-cleanup` sur branche `chore/issue-9-remove-orphaned-booking` depuis `main`.
2. Supprimer les trois fichiers + le dossier vide.
3. Vérifier propreté : `grep`, `npm run lint`, `npm run build`.
4. Smoke test manuel sur dev server (`npm run dev`).
5. Commit unique avec message conventionnel et `Closes #9`.
6. Fast-forward merge vers `main`.
7. Cleanup : `git worktree remove .worktrees/booking-cleanup` + `git branch -d chore/issue-9-remove-orphaned-booking`.
8. Push vers `origin main` (avec confirmation utilisateur, pas de push automatique).

Le détail pas-à-pas est laissé au plan d'implémentation (`writing-plans`).

## 7. Risques et mitigations

| Risque | Probabilité | Mitigation |
|---|---|---|
| Une référence externe oubliée casse le build | Très faible | `grep` complet effectué (aucun match) ; `npm run build` exécuté avant merge |
| Un lien externe (email, doc, blog) pointe vers `/booking` | Faible | 404 propre côté Next.js ; les utilisateurs réels passent par la nav ou le hero qui pointent vers `/reserver` |
| Régression du flux Stripe success | Nul | `/booking/success` est un fichier séparé (`success/page.tsx`), pas touché |

## 8. Justification de fermeture issue #9

Commentaire à poster sur l'issue lors de la fermeture :

> Audit effectué : la page `/booking` est orpheline (aucun lien entrant dans l'app) et son bouton « Continuer » redirige vers `/booking/location` qui n'existe pas. Le vrai flux de réservation est `/reserver` via `BookingWizard`. Plutôt que de migrer du code mort vers Cinétique, on supprime la page et ses composants exclusifs (`ServiceCatalog`, `ServiceCard`). Le critère d'acceptation « aucun token Tailwind brut hors palette Cinétique » est satisfait par suppression. Spec : `docs/superpowers/specs/2026-04-26-issue-9-remove-orphaned-booking-design.md`.
