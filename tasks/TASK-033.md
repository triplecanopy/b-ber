# TASK-033: Evaluate code coverage tooling for the modernized stack

**Status:** complete
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

- [x] **Audit current state**: `istanbul`, `istanbul-api`, `istanbul-reports`,
      and `coveralls` are devDependencies in root `package.json` only — no
      references in any scripts, config files, or CI. All four are confirmed
      orphans and have been removed.
- [x] **Verify the SWC/Istanbul breakage**: `jest.config.js` already has
      `coverageProvider: 'v8'` set (landed in the Jest v29 upgrade, TASK-034).
      Istanbul instrumentation is no longer in the picture.
- [x] **Evaluate V8 coverage provider**: Already adopted. `coverageProvider: 'v8'`
      works with `@swc/jest` with no additional configuration and correctly
      resolves TypeScript source maps via the existing `@swc/jest` transform.
- [x] **Evaluate Vitest coverage**: Not applicable yet; TASK-006 (Vite migration)
      is not complete. Vitest coverage (`@vitest/coverage-v8`) remains the
      natural end-state once the test runner migrates, but no action needed now.
- [x] **Evaluate c8**: Not needed; Jest's built-in V8 provider covers the use
      case without an extra CLI tool.
- [x] **Assess reporting / upload**: No upload service is in active use.
      `coveralls` removed. Upload service evaluation deferred to TASK-049.
- [x] **Recommend and document**: **Recommendation:** keep `coverageProvider: 'v8'`
      (already set), remove the four orphaned legacy packages (done), and do not
      add an upload service until TASK-049 evaluates the options. The
      `test:coverage` script (`rimraf ./coverage && jest --collectCoverage=true`)
      produces `html`, `lcov`, and `json` reports locally — no further config
      changes needed.

## Notes

Branch: `feat/upgrades` (research only)

**Removed packages:** `coveralls@3.0.1`, `istanbul@0.4.5`, `istanbul-api@1.2.2`,
`istanbul-reports@1.1.4` — all confirmed orphans with no references outside
`package.json`.

**Follow-on:** TASK-049 — evaluate whether uploading coverage reports to an
external service (Codecov, Coveralls, GitHub Actions summary) provides value.

Related: [[TASK-004]] (test coverage goals), [[TASK-006]] (Vite migration),
[[TASK-015]] (Biome migration).
