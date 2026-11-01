# TASK-130: Run the Playwright suites against the workspace CLI, in CI

**Epic:** E2E testing
**GitHub Issue:** #683 — https://github.com/triplecanopy/b-ber/issues/683
**Scope:** b-ber-testing

## Description

The Playwright suites in `b-ber-testing` (CLI smoke tests and reader browser
tests) are the only tests that run the real build end to end. They could not
verify a pull request, for three reasons:

1. **They ran whichever `bber` was on `PATH`.** `runBber` and `globalSetup`
   stripped `node_modules/.bin` from `PATH`, so `spawnSync('bber')` resolved to a
   global install. In CircleCI that happened to be the workspace build, because
   of an `npm link` step (TASK-044). Locally it was whatever version someone last
   installed. On a machine with no global `bber`, `globalSetup` failed outright.
   The strip itself was a workaround: npm does not create the workspace `bber`
   link when `packages/b-ber-cli/dist/` is missing at install time.
2. **The reader fixture was built once and reused.** `globalSetup` skipped the
   build whenever `_builds-reader/manifest.json` existed. After a dependency
   upgrade the browser tests could therefore run against output from an earlier
   checkout, and the build output is exactly what an upgrade changes.
3. **GitHub Actions never ran them.** `ci.yml` ran build plus `npm test` (Jest).
   CircleCI has an `e2e` job, but CircleCI reports no statuses to GitHub (see
   `ci.yml`'s header).

This matters now because of the Renovate switch (TASK-129). Jest mocks heavily:
`image-size` is mocked in the main tests of both packages that import it, so a
breaking `image-size` upgrade passes Jest. The Playwright suites are what would
catch it.

### Changes

- `tests/cli/helpers.ts`: `BBER_BIN` defaults to
  `packages/b-ber-cli/dist/index.js` and is run with `process.execPath`.
  `assertBberBuilt()` fails fast with a "run `npm run build`" message.
- `tests/e2e/globalSetup.ts`: always rebuilds the reader fixture with that CLI.
  A fresh build takes about 0.5s.
- Six reader tests that fail on `main` are `test.skip`ped. Reworking them is
  TASK-131.
- `.github/workflows/ci.yml`: a new `e2e` job (build, then Chromium cached by
  Playwright version, then `npx playwright test`, uploading `test-results/` on
  failure). It is **not** a required check yet.

## Findings (2026-11-01, `main` @ `ee8af41c`)

- With a shim putting the workspace CLI on `PATH`, the unmodified suite gave
  **34 passed, 6 failed, 1 skipped in 10.5 minutes**. Every CLI test passed. All
  six failures were reader navigation/edge-case tests, five of them 120s
  timeouts. That is the whole of the runtime.
- After this change, with **no** global `bber` installed:
  **33 passed, 8 skipped, 22.4s**. The 8 skips are the six above, the Vimeo test
  (`NO_NETWORK=1`) and one existing conditional skip.

### The six skipped tests

| Spec | Test |
| ---- | ---- |
| `navigation.spec.ts` | initial load renders the first spine item |
| `navigation.spec.ts` | chapter-next button advances to the next spine item |
| `navigation.spec.ts` | chapter-prev button rewinds to the previous spine item |
| `navigation.spec.ts` | URL query string updates to reflect spine position after navigation |
| `navigation.spec.ts` | keyboard right arrow navigates pages within a chapter |
| `edge-cases.spec.ts` | chapter-next is absent when navigating to the last chapter via next button |

## Subtasks

- [x] Resolve the CLI under test explicitly (`BBER_BIN`), not via `PATH`
- [x] Rebuild the reader fixture on every run
- [x] Skip the six failing reader tests, each pointing at TASK-131
- [x] Add an `e2e` job to `.github/workflows/ci.yml`
- [x] Update `b-ber-testing` README and AGENTS.md
- [ ] Confirm the `e2e` job passes on this PR in GitHub Actions
- [ ] After a run of green PRs, make `e2e` a required check (root AGENTS.md
      "Requiring the CI gate")

## Notes

- CircleCI's `e2e` job keeps working unchanged: its `npm link` step is now
  redundant, since the tests no longer look at `PATH`. Consolidating CircleCI and
  Actions is TASK-045.
- The suite runs on every PR, not only dependency PRs. At about 22s plus the
  Chromium install, the cost is small, and a suite that only runs sometimes rots.
  TASK-132 (the dependency impact workflow) builds on this job rather than
  duplicating it.
- Related: TASK-041–044 (built the suite), TASK-129 (Renovate), TASK-131 (the
  skipped tests), TASK-132 (dependency-major testing policy and workflow).
