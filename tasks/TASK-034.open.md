# TASK-034: Upgrade Jest from v26 to v29

**Status:** not started
**Scope:** monorepo
**Priority:** high

## Description

The monorepo uses Jest 26.6.3 (released 2021). Jest 29 is the current stable
release. Three major versions of breaking changes have accumulated, and several
are directly relevant to the b-ber stack:

- **Jest 27** removed `testURL` (moved into `testEnvironmentOptions.url`),
  changed the default test runner to `jest-circus` (from `jasmine2`), and
  introduced `coverageProvider: 'v8'` as a first-class option.
- **Jest 28** changed `testEnvironment` defaults, dropped bundled `jest-jasmine2`,
  introduced package-level `jest-environment-jsdom` (now a separate install),
  and tightened `transform` API behaviour.
- **Jest 29** improved TypeScript support, stabilised ESM handling, changed
  snapshot serializer output, and further aligned `@jest/globals` types.

Every package has its own `jest.config.js`. The root config and all
per-package configs need to be updated in concert. The `testURL` key is
present in almost every package config and will emit a deprecation warning
(or error) under Jest 27+.

This task is closely related to TASK-033 (coverage tooling) — upgrading Jest
is the right moment to also adopt `coverageProvider: 'v8'`, which fixes the
broken Istanbul/SWC interaction.

## Subtasks

- [ ] **Research breaking changes**: read Jest 27, 28, and 29 migration guides;
      produce a per-change impact list against b-ber's actual config surface.
- [ ] **Upgrade jest to v29** in root `package.json` (and audit per-package
      `jest` devDependencies — most delegate to the root install).
- [ ] **Install `jest-environment-jsdom`** as a separate package (required from
      Jest 28+; was previously bundled). Update packages that use
      `testEnvironment: 'jsdom'` or `jest-environment-jsdom-global`.
- [ ] **Replace `testURL`** with `testEnvironmentOptions: { url: '...' }` across
      all per-package `jest.config.js` files and the root config.
- [ ] **Update `setupFiles` / `setupFilesAfterEnv`**: verify `jest-extended` and
      the reader-react `jest.setup.js` still work under Jest 29.
- [ ] **Adopt `coverageProvider: 'v8'`** in root `jest.config.js` (coordinate
      with TASK-033; do not do this in isolation if TASK-033 is already in flight).
- [ ] **Run full suite** (`npm test`) from root; resolve any failures.
- [ ] **Update AGENTS.md** if any monorepo-wide test command changes.

## Notes

Branch: `feat/upgrades` (no separate feature branch needed — config-only change)

`jest-environment-jsdom-global` (used by the root config) is a third-party
wrapper; verify it has a Jest 29-compatible release before upgrading, or replace
it with the standard `jest-environment-jsdom` with manual global setup.

Per-package `jest` devDependencies: most packages list `jest: ^26.6.3` in
their own devDependencies. After upgrading root, check whether per-package
installs are hoisted or independently resolved, and update version ranges
accordingly.

Related: [[TASK-033]] (coverage tooling), [[TASK-035]] (CircleCI — runs Jest in CI)
