# Remove Vitest Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Eradicate Vitest dependencies/configs/tests from `lavage-auto` so production builds never import Vitest.

**Architecture:** Delete obsolete Booking unit specs and Vitest config, update package metadata to drop Vitest tooling, and verify no lingering references remain. Use `git grep`/lint to confirm removal. No runtime source updates needed.

**Tech Stack:** Node.js, Next.js, npm scripts, git, ESLint.

---

### Task 1: Remove Booking unit specs

**Files:**
- Delete: `src/components/booking/__tests__/BookingWizard.test.tsx`
- Delete: `src/components/booking/__tests__/StepService.test.tsx`

**Step 1: Delete BookingWizard test file**

Run:
```bash
rm src/components/booking/__tests__/BookingWizard.test.tsx
```

**Step 2: Delete StepService test file**

Run:
```bash
rm src/components/booking/__tests__/StepService.test.tsx
```

**Step 3: Verify folder**

Run:
```bash
ls src/components/booking/__tests__
```
Expected: directory empty (or absent).

**Step 4: Commit**

```bash
git add src/components/booking/__tests__/BookingWizard.test.tsx src/components/booking/__tests__/StepService.test.tsx
git commit -m "chore: remove booking vitest specs"
```

### Task 2: Remove Vitest config file

**Files:**
- Delete: `vitest.config.ts`

**Step 1: Delete config**

Run:
```bash
rm vitest.config.ts
```

**Step 2: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: drop vitest config"
```

### Task 3: Update package metadata

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Step 1: Remove Vitest-related deps**

Edit `package.json` to delete `vite` (only remaining Vitest dependency). Ensure scripts don’t mention Vitest.

**Step 2: Regenerate lockfile**

Run:
```bash
npm install
```
Expected: lockfile drops `vite` and any Vitest transitive packages.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: remove vitest deps"
```

### Task 4: Verify removal and lint

**Files:** None

**Step 1: Ensure no Vitest references**

Run:
```bash
git grep -i vitest || true
```
Expected: no matches.

**Step 2: Run lint**

Run:
```bash
npm run lint
```
Expected: passes.

**Step 3: Commit verification note**

If no changes, skip commit; otherwise commit any last-minute fixes referencing lint results.

### Task 5: Document follow-up

**Files:**
- Modify: `README.md` (optional note)
- Modify: `docs/plans/2026-03-29-remove-vitest-design.md`

**Step 1: Append follow-up note**

Add short paragraph in design doc acknowledging deleted tests and linking future Jest migration task. Optionally add TODO in README linking to future issue.

**Step 2: Commit**

```bash
git add docs/plans/2026-03-29-remove-vitest-design.md README.md
git commit -m "docs: note vitest removal follow-up"
```
