# TASK-049: Evaluate coverage report upload services

**Status:** complete
**Scope:** monorepo
**Priority:** low
**GitHub Issue:** #516 — https://github.com/triplecanopy/b-ber/issues/516

## Description

`coveralls` was removed in TASK-033 because the project does not currently
upload coverage reports to any external service. This task evaluates whether
doing so would provide meaningful benefit, and if so, which service fits best.

The monorepo now uses Jest 29 with `coverageProvider: 'v8'` and generates
`html`, `lcov`, and `json` reports via `npm run test:coverage`. The `lcov`
format is the standard input for most upload services.

## Subtasks

- [x] **Evaluate GitHub Actions native summary**: rejected — the project's CI
      is CircleCI, not GitHub Actions, so a GHA job summary doesn't apply.
- [x] **Evaluate Codecov**: chosen. Free for public repos; the `lcov` report we
      already emit is its native input; per-PR diff annotations and a README
      badge are the concrete value.
- [x] **Evaluate Coveralls**: rejected in favour of Codecov (better monorepo
      flag support and PR diff UX).
- [x] **Assess team need**: a single always-current badge + PR coverage diff
      replaces the hand-maintained per-package table that had drifted out of sync.
- [x] **Recommend or close**: implemented directly (small change).

## Notes

Branch: `feat/upgrades`

**Implemented:** the CircleCI `build` job now runs `npx jest --collectCoverage`
and uploads `coverage/lcov.info` via the `codecov/codecov@4` orb. Added a
README badge and a root `codecov.yml` (75% informational target, non-blocking).
Coverage collection was scoped to `packages/*/src` first (see the
`fix(monorepo): scope coverage collection` commit) so the uploaded numbers are
accurate.

**Manual follow-up (one-time):** create the Codecov account, authorize
`triplecanopy/b-ber`, and set `CODECOV_TOKEN` in CircleCI project env vars.
Until then the upload step no-ops and the badge shows "unknown".

Related: [[TASK-033]] (coverage tooling evaluation — removed orphaned istanbul
and coveralls deps, confirmed V8 provider), [[TASK-044]] (CI pipeline this
hooks into)
