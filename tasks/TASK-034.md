# TASK-034: Upgrade Jest from v26 to v29

**Status:** complete
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** high
**GitHub Issue:** #489 — https://github.com/triplecanopy/b-ber/issues/489

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

- [x] **Research breaking changes**: read Jest 27, 28, and 29 migration guides;
      produce a per-change impact list against b-ber's actual config surface.
- [x] **Upgrade jest to v29** in root `package.json` and all per-package
      `devDependencies` (`^26.6.3` → `^29.7.0`).
- [x] **Upgrade related packages**: `jest-environment-jsdom` → `^29.7.0`,
      `jest-environment-jsdom-global` → `^4.0.0`, `jest-extended` → `^3.2.4`
      (root + b-ber-cli, b-ber-reader, b-ber-reader-react); `ts-jest` → `^29.4.11`
      (root + b-ber-validator); `babel-jest` → `^29.7.0` (root).
- [x] **Remove dangling `babel-cli@6`** from `b-ber-validator/package.json` (unused
      since validator was converted to TypeScript with `tsc`).
- [x] **Replace `testURL`** with `testEnvironmentOptions: { url: '...' }` across
      all per-package `jest.config.js` files (35 files) and the root config.
- [x] **Adopt `coverageProvider: 'v8'`** in root `jest.config.js`.
- [x] **Update `jest-transform-upward.js`** API: `babel-jest` v27+ moved
      `createTransformer` onto the default export; updated all 9 files.
- [x] **Fix duplicate `verbose: false`** in `b-ber-validator/jest.config.js`.
- [x] **Run full suite** (`npm install && npm test`) from root; 84/84 suites pass.
- [x] **Fix mobi template test**: automock regression in Jest 29 jest-circus — added
      factory `() => ({ build: 'mobi', src: { images: path => path } })` to
      `jest.mock('@canopycanopycanopy/b-ber-lib/State')` in mobi.test.js; updated
      24 snapshots to match Jest 29 serializer format.
- [x] **Update all template snapshots**: Jest 29 changed string quote escaping in
      snapshot serialization — updated 113 snapshots across 9 template test suites.

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
