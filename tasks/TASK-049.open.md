# TASK-049: Evaluate coverage report upload services

**Status:** not started
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

- [ ] **Evaluate GitHub Actions native summary**: `jest --coverage` output can
      be posted as a job summary via `actions/upload-artifact` + a coverage
      action (e.g. `davelosert/vitest-coverage-report-action` or similar). No
      external service required. Assess setup cost vs. value.
- [ ] **Evaluate Codecov**: Free for public repos; good PR diff annotations and
      trend graphs. Requires a token for private repos. Assess whether the repo
      is public/private and what the badge/annotation value would be.
- [ ] **Evaluate Coveralls**: Was previously a listed dependency (removed in
      TASK-033). Assess current pricing and feature set vs. Codecov.
- [ ] **Assess team need**: Does the team actually want coverage trends over
      time? Would PR annotations for coverage regressions change behavior?
- [ ] **Recommend or close**: If no clear benefit, close with "not warranted at
      this time." If a service is chosen, open an implementation task.

## Notes

Branch: `feat/upgrades` (research only)

Related: [[TASK-033]] (coverage tooling evaluation — removed orphaned istanbul
and coveralls deps, confirmed V8 provider)
