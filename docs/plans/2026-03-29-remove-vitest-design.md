# Remove Vitest References Design

## Goal
Eliminate every Vitest dependency, configuration file, and spec from `lavage-auto` so production builds no longer pull Vitest into the bundle or tooling chain. Unit coverage for BookingWizard/StepService will be temporarily removed until we reintroduce Jest-based tests.

## Context & Constraints
- Only a pair of Booking components currently rely on Vitest; no other part of the repo imports it.
- Build pipeline uses Next.js and Playwright; removing Vitest must not disturb linting or Playwright suites.
- Short-term priority is production stability, so removing flaky unit tests is acceptable.

## Architecture & Scope
- Delete the obsolete spec files under `src/components/booking/__tests__` plus `vitest.config.ts`.
- Remove Vitest-related packages (`vitest`, transitively `vite`) from tooling metadata.
- Ensure no scripts or docs mention Vitest afterward; rely on existing Playwright E2E coverage.

## Risks & Mitigation
- Loss of Booking unit coverage → document follow-up task to recreate tests with Jest/RTL.
- Possible unused `@testing-library/*` deps remain → acceptable until new Jest setup; note for cleanup sprint.

## Acceptance Criteria
1. `git grep -i vitest` returns no matches.
2. `npm run lint` succeeds without Vitest config.
3. Only Playwright remains as the test runner in package metadata.

## Follow-Up Work
- Plan Jest/React Testing Library replacement tests for BookingWizard and StepService.
- Revisit devDependencies to drop unused testing libraries once Jest strategy is defined.
