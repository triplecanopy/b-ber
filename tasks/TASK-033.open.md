# TASK-033: Evaluate code coverage tooling for the modernized stack

**Status:** not started
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #488 — https://github.com/triplecanopy/b-ber/issues/488

## Description

The monorepo currently uses Jest 26 with an implicit Istanbul
(`babel-plugin-istanbul`) coverage provider, backed by three orphaned root-level
packages: `istanbul@0.4.5` (a 2015-era CLI), `istanbul-api@1.2.2`, and
`istanbul-reports@1.1.4`. An upload integration via `coveralls@3.0.1` is also
present. `collectCoverage` is set to `false` in the root `jest.config.js`, so
coverage collection is opt-in via `--coverage` at the command line.

Once the TS/Vite/tsdown/Biome migration is complete, several of these choices
become stale or broken:

- `babel-plugin-istanbul` requires Babel to instrument source files. All
  TS-migrated packages now use `@swc/jest` as the transform, which bypasses
  Babel entirely. Running `jest --coverage` on these packages today will produce
  inaccurate or empty coverage because the SWC transform is never instrumented
  by Istanbul.
- `istanbul@0.4.5` pre-dates `nyc` and is almost certainly unused directly;
  it may be an orphaned dev dependency from an early CI script.
- `coveralls` is a third-party upload service; Codecov and GitHub Actions
  native coverage reporting are now more common alternatives.
- The Vite migration (TASK-006) opens the door to Vitest, which ships its own
  first-class coverage support.

This task is a research task. No implementation is required — the output is a
recommendation and a follow-on task if a change is warranted.

## Subtasks

- [ ] **Audit current state**: Confirm which packages actually collect coverage
      today (run `npm test -- --coverage` from root; check which suites produce
      non-empty output). Identify whether `istanbul`, `istanbul-api`, and
      `istanbul-reports` are referenced anywhere beyond `package.json`.
- [ ] **Verify the SWC/Istanbul breakage**: Confirm that Istanbul instrumentation
      does not fire for packages using `@swc/jest`. This is the primary blocker
      for the status quo.
- [ ] **Evaluate V8 coverage provider**: Jest 27+ ships a `coverageProvider: 'v8'`
      option that uses Node's built-in V8 coverage engine instead of Istanbul.
      Works with any transform including SWC. Assess accuracy, config overhead,
      and whether it covers TypeScript source maps correctly.
- [ ] **Evaluate Vitest coverage**: `@vitest/coverage-v8` and
      `@vitest/coverage-istanbul` are the Vitest-native options. Relevant only if
      TASK-006 (Vite migration) is complete or imminent, but worth noting as the
      natural end-state if the reader-react test suite migrates to Vitest.
- [ ] **Evaluate c8**: Standalone V8-based coverage CLI; can wrap any test runner.
      Less relevant if Jest's built-in V8 provider meets the need.
- [ ] **Assess reporting / upload**: Does the project want to upload coverage
      to a service (Codecov, Coveralls, GitHub Actions summary)? If coveralls is
      not actively used, remove it.
- [ ] **Recommend and document**: Write up a one-paragraph recommendation with
      the chosen provider, any packages to remove, and what the
      `jest.config.js` change looks like. Open a follow-on implementation task
      if a change is warranted.

## Notes

Branch: `feat/upgrades` (research only)

**Key constraint:** Any solution must work with `@swc/jest` transforms, since all
TS-migrated packages use SWC and Babel is being removed. V8 coverage (`coverageProvider: 'v8'`) is the minimal-change path — it requires one line in
`jest.config.js` and no new packages. Vitest is the right long-term answer if the
project moves its test runner to Vitest post-Vite-migration.

**Packages to audit for removal:** `istanbul@0.4.5`, `istanbul-api@1.2.2`,
`istanbul-reports@1.1.4` in root `package.json` devDependencies. These predate
`nyc` and are very likely orphans.

Related: [[TASK-004]] (test coverage goals), [[TASK-006]] (Vite migration),
[[TASK-015]] (Biome migration).
