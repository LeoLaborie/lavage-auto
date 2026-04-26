# Issue #9 — Suppression de la page `/booking` orpheline — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supprimer `src/app/booking/page.tsx` et ses composants exclusifs (`ServiceCatalog`, `ServiceCard`) — code mort pointant vers une route fantôme — et fermer l'issue #9 GitHub avec justification.

**Architecture:** Tâche purement destructive, aucun nouveau code. Travail en worktree isolé sur une branche `chore/issue-9-remove-orphaned-booking`, vérifications statiques (`grep`, `lint`, `build`) + smoke test manuel, puis fast-forward merge sur `main`. Fermeture de l'issue avec commentaire explicatif.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind, Git worktrees, GitHub CLI (`gh`).

**Spec:** `docs/superpowers/specs/2026-04-26-issue-9-remove-orphaned-booking-design.md`

---

## Inventaire des fichiers

| Action | Chemin | Note |
|---|---|---|
| Delete | `src/app/booking/page.tsx` | Wrapper 16 lignes, route orpheline |
| Delete | `src/components/features/booking/ServiceCatalog.tsx` | Importé uniquement par la page ci-dessus |
| Delete | `src/components/features/booking/ServiceCard.tsx` | Importé uniquement par `ServiceCatalog` |
| Delete (dir) | `src/components/features/booking/` | Devient vide après les deux suppressions |
| Untouched | `src/app/booking/success/page.tsx` | Callback Stripe, indépendant — vérifié |
| Untouched | `src/app/reserver/page.tsx` + `src/components/booking/` | Vrai flux de réservation |
| Untouched | `src/lib/constants/services.ts` | Catalogue services consommé ailleurs |

---

## Task 1: Création du worktree isolé

**Files:**
- Create: `.worktrees/booking-cleanup/` (worktree git, hors scope du repo)

- [ ] **Step 1: Vérifier l'état du repo principal**

Run depuis `/home/leo/Documents/Code/Web-Projects/lavage-auto`:
```bash
git status
git branch --show-current
git log --oneline -1
```

Expected:
- `git status` → working tree clean (sauf éventuellement le spec déjà commité — OK)
- branche courante : `main`
- HEAD : `12a4f04 docs(spec): add design for issue #9 — remove orphaned /booking page`

- [ ] **Step 2: Créer le worktree sur une nouvelle branche depuis main**

```bash
git worktree add -b chore/issue-9-remove-orphaned-booking .worktrees/booking-cleanup main
```

Expected: `Preparing worktree (new branch 'chore/issue-9-remove-orphaned-booking')` + `HEAD is now at 12a4f04 ...`

- [ ] **Step 3: Confirmer le worktree**

```bash
git worktree list | grep booking-cleanup
```

Expected: une ligne contenant `.worktrees/booking-cleanup` et `[chore/issue-9-remove-orphaned-booking]`.

- [ ] **Step 4: Vérifier que le worktree contient bien les fichiers à supprimer**

```bash
ls .worktrees/booking-cleanup/src/app/booking/
ls .worktrees/booking-cleanup/src/components/features/booking/
```

Expected:
- Premier `ls` : `page.tsx  success` (le dossier `success/` reste, on ne le touche pas)
- Second `ls` : `ServiceCard.tsx  ServiceCatalog.tsx`

> **Note de cadrage** : Toutes les commandes des Tasks 2 à 5 s'exécutent **depuis** `.worktrees/booking-cleanup/`. Pour les commandes Bash de l'agent, utiliser le chemin absolu `/home/leo/Documents/Code/Web-Projects/lavage-auto/.worktrees/booking-cleanup` ou `cd .worktrees/booking-cleanup && <cmd>`. Les chemins relatifs ci-dessous sont relatifs à la racine du worktree.

---

## Task 2: Suppression des fichiers et du dossier vide

**Files:**
- Delete: `src/app/booking/page.tsx`
- Delete: `src/components/features/booking/ServiceCatalog.tsx`
- Delete: `src/components/features/booking/ServiceCard.tsx`
- Delete (dir): `src/components/features/booking/`

- [ ] **Step 1: Supprimer la page racine `/booking`**

Depuis le worktree :
```bash
rm src/app/booking/page.tsx
```

- [ ] **Step 2: Supprimer les deux composants exclusifs**

```bash
rm src/components/features/booking/ServiceCatalog.tsx
rm src/components/features/booking/ServiceCard.tsx
```

- [ ] **Step 3: Supprimer le dossier `features/booking/` désormais vide**

```bash
rmdir src/components/features/booking
```

Expected: aucune erreur. Si `rmdir` se plaint que le dossier n'est pas vide, lister son contenu (`ls src/components/features/booking`) et investiguer (fichier caché ? autre fichier non listé en spec ?).

- [ ] **Step 4: Confirmer l'état Git**

```bash
git status
```

Expected: trois `deleted: ...` correspondant exactement aux fichiers de Step 1 et Step 2. Aucune autre modification.

- [ ] **Step 5: Vérifier qu'aucune référence ne subsiste**

```bash
grep -rn "features/booking\|ServiceCatalog\|ServiceCard" src/ tests/ 2>/dev/null
```

Expected: aucune sortie (exit code 1). Si un résultat apparaît, ne pas continuer — investiguer la référence orpheline.

---

## Task 3: Vérifications statiques

**Files:** aucun (vérifications sans modification).

- [ ] **Step 1: Lint**

```bash
npm run lint
```

Expected: pas de nouvelle erreur ESLint. Si des warnings préexistants apparaissent, les noter mais ne pas les traiter (hors scope). Aucune erreur ne doit pointer sur les chemins supprimés.

- [ ] **Step 2: Build production**

```bash
npm run build
```

Expected:
- `prisma generate` réussit
- `next build` réussit
- La sortie liste les routes générées : `/reserver`, `/booking/success`, etc., **sans** `/booking` (juste `/booking/success`).
- Aucune erreur TypeScript.

Si le build échoue avec `Module not found` sur `ServiceCatalog` ou `ServiceCard`, c'est qu'une référence a été manquée — revenir à Task 2 Step 5.

- [ ] **Step 3: Confirmer la disparition de la route `/booking`**

Dans la sortie de `npm run build`, chercher la table des routes (`Route (app)` ou similaire). Vérifier :
- ❌ pas de ligne pour `/booking` (root)
- ✅ ligne présente pour `/booking/success`
- ✅ ligne présente pour `/reserver`

---

## Task 4: Smoke test manuel sur le dev server

**Files:** aucun.

- [ ] **Step 1: Démarrer le dev server**

```bash
npm run dev
```

Lancer en arrière-plan ou dans un terminal séparé. Attendre `Ready in Xs` et l'URL `http://localhost:3000`.

- [ ] **Step 2: Tester la racine `/booking` (doit être 404)**

Dans le navigateur ou via curl :
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/booking
```

Expected: `404`.

- [ ] **Step 3: Tester `/reserver` (doit charger le BookingWizard)**

Ouvrir `http://localhost:3000/reserver` dans le navigateur.

Expected:
- Page charge sans erreur 500
- Le `BookingWizard` s'affiche (étape Service)
- Aucune erreur dans la console navigateur (DevTools → Console)

- [ ] **Step 4: Tester `/booking/success` sans bookingId (doit rediriger)**

```bash
curl -s -o /dev/null -w "%{http_code}\n" -L --max-redirs 0 http://localhost:3000/booking/success
```

Expected: `307` ou `302` vers `/dashboard` (cf. `success/page.tsx:21` `redirect('/dashboard')`). C'est normal — confirme que la page `success` reste opérationnelle.

- [ ] **Step 5: Arrêter le dev server**

`Ctrl+C` dans le terminal, ou tuer le process en arrière-plan. Confirmer la libération du port 3000 :
```bash
lsof -i :3000
```
Expected: aucune sortie.

---

## Task 5: Commit

**Files:** aucun (commit Git uniquement).

- [ ] **Step 1: Vérifier le diff staged**

```bash
git add -A
git diff --cached --stat
```

Expected: exactement 3 fichiers en suppression avec le total de lignes proche de `137 deletions(-)` (16 + 65 + 56 = 137).

- [ ] **Step 2: Créer le commit avec message conventionnel**

```bash
git commit -m "$(cat <<'EOF'
chore(booking): remove orphaned /booking page and unused service catalog

La page /booking était orpheline (aucun lien entrant dans l'app) et son
bouton "Continuer" pointait vers /booking/location, route inexistante. Le
flux de réservation actif passe par /reserver via BookingWizard.

Suppression de :
- src/app/booking/page.tsx (wrapper de la route racine /booking)
- src/components/features/booking/ServiceCatalog.tsx
- src/components/features/booking/ServiceCard.tsx

src/app/booking/success/ (callback Stripe) reste intact.

Closes #9

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Expected: `[chore/issue-9-remove-orphaned-booking <hash>] chore(booking): ...` + `3 files changed, 0 insertions(+), 137 deletions(-)`.

- [ ] **Step 3: Confirmer le log**

```bash
git log --oneline main..HEAD
```

Expected: une seule ligne — le commit qu'on vient de créer.

---

## Task 6: Merge fast-forward sur main

**Files:** aucun.

> Toutes les commandes de cette task s'exécutent depuis le repo principal `/home/leo/Documents/Code/Web-Projects/lavage-auto`, **pas** depuis le worktree.

- [ ] **Step 1: Revenir au repo principal et vérifier l'état**

```bash
cd /home/leo/Documents/Code/Web-Projects/lavage-auto
git status
git branch --show-current
```

Expected: working tree clean, branche `main`.

- [ ] **Step 2: Vérifier la faisabilité du fast-forward**

```bash
git merge-base --is-ancestor main chore/issue-9-remove-orphaned-booking && echo "FF-able" || echo "NOT FF-able"
```

Expected: `FF-able`. Si `NOT FF-able`, c'est que `main` a divergé depuis la création du worktree — revenir à l'utilisateur pour décider rebase vs merge commit.

- [ ] **Step 3: Effectuer le merge fast-forward**

```bash
git merge --ff-only chore/issue-9-remove-orphaned-booking
```

Expected: `Updating 12a4f04..<new-hash>` + `Fast-forward` + `3 files changed, 137 deletions(-)`.

- [ ] **Step 4: Confirmer le HEAD de main**

```bash
git log --oneline -3
```

Expected: le commit `chore(booking): remove orphaned ...` est en HEAD de `main`, suivi de `12a4f04 docs(spec): ...`.

---

## Task 7: Cleanup du worktree et de la branche

**Files:** suppression du worktree `.worktrees/booking-cleanup/` et de la branche locale.

- [ ] **Step 1: Retirer le worktree**

```bash
git worktree remove .worktrees/booking-cleanup
```

Expected: aucune erreur. Le dossier `.worktrees/booking-cleanup/` n'existe plus.

- [ ] **Step 2: Supprimer la branche locale**

```bash
git branch -d chore/issue-9-remove-orphaned-booking
```

Expected: `Deleted branch chore/issue-9-remove-orphaned-booking (was <hash>).` Si Git refuse avec « not fully merged », vérifier que le merge en Task 6 a bien réussi.

- [ ] **Step 3: Vérifier l'état final**

```bash
git worktree list
git branch
```

Expected:
- `git worktree list` ne mentionne plus `booking-cleanup` (les autres worktrees préexistants restent visibles).
- `git branch` ne contient plus `chore/issue-9-remove-orphaned-booking`.

---

## Task 8: Confirmation utilisateur avant push et fermeture issue

**Files:** aucun. Étape de coordination — **stop ici sans action utilisateur**.

- [ ] **Step 1: Présenter le récap à l'utilisateur**

Afficher dans le chat :
- Hash du commit de merge (HEAD `main`)
- Nombre de lignes supprimées (137)
- Smoke test : OK
- Build : OK

Demander explicitement :
> "Le merge est effectué localement. Tu veux que je :
> (a) push `main` vers `origin` et ferme l'issue #9 avec le commentaire de justification ?
> (b) push uniquement, sans toucher à l'issue ?
> (c) ne rien push pour l'instant ?"

- [ ] **Step 2: Si (a) — Push main vers origin**

```bash
git push origin main
```

Expected: push successful.

- [ ] **Step 3: Si (a) — Fermer l'issue #9 avec commentaire**

```bash
gh issue close 9 --comment "$(cat <<'EOF'
Audit effectué : la page `/booking` est orpheline (aucun lien entrant dans l'app) et son bouton « Continuer » redirigeait vers `/booking/location`, route inexistante. Le vrai flux de réservation est `/reserver` via `BookingWizard`.

Plutôt que de migrer du code mort vers Cinétique, suppression de la page et de ses composants exclusifs (`ServiceCatalog`, `ServiceCard`). Le critère d'acceptation « aucun token Tailwind brut hors palette Cinétique » est satisfait par suppression.

- Spec : `docs/superpowers/specs/2026-04-26-issue-9-remove-orphaned-booking-design.md`
- Plan : `docs/superpowers/plans/2026-04-26-issue-9-remove-orphaned-booking.md`
- Commit : voir HEAD de `main`
EOF
)"
```

Expected: l'issue #9 passe en `CLOSED` avec le commentaire posté.

- [ ] **Step 4: Si (b) — Push seulement**

```bash
git push origin main
```

Pas de commande `gh issue close`. Informer l'utilisateur que l'issue reste ouverte.

- [ ] **Step 5: Si (c) — Ne rien faire**

Informer l'utilisateur que le merge est local-only, et donner la commande `git push origin main` qu'il pourra lancer manuellement.

---

## Critères de réussite globale

- [ ] `src/app/booking/page.tsx` n'existe plus sur `main`
- [ ] `src/components/features/booking/` n'existe plus sur `main`
- [ ] `src/app/booking/success/` est intact et fonctionnel
- [ ] `npm run build` et `npm run lint` passent
- [ ] `/reserver` charge correctement, `/booking` retourne 404
- [ ] Worktree `.worktrees/booking-cleanup` supprimé, branche `chore/issue-9-remove-orphaned-booking` supprimée
- [ ] Décision utilisateur prise sur push/issue (Task 8)
