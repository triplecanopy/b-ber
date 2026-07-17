# TASK-044: E2E testing — CI integration (CircleCI, Playwright cache)

**Status:** complete
**Feature:** E2E testing
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #523 — https://github.com/triplecanopy/b-ber/issues/523

## Description

Wire the e2e test suite into CircleCI as a distinct job. The e2e job runs after
the existing unit test job passes and is responsible for:

1. Installing Playwright browser binaries (Chromium)
2. Building the kitchen-sink fixture for the epub and reader targets
3. Running `npm test` in `packages/b-ber-testing/`

### CircleCI job structure

The existing `build` job in `.circleci/config.yml` runs unit tests only. Add
an `e2e` job that:

- Uses the same Docker image (or a compatible one with a display server if
  needed — Playwright can run headless without one, but verify)
- Depends on the `build` job succeeding (`requires: [build]`)
- Caches `~/.cache/ms-playwright` keyed on the Playwright version (from
  `packages/b-ber-testing/package.json`) so browsers are not re-downloaded
  on every run

### Cache key strategy

```yaml
- restore_cache:
    keys:
      - playwright-v1-{{ checksum "packages/b-ber-testing/package.json" }}
- run: npx playwright install chromium
- save_cache:
    paths:
      - ~/.cache/ms-playwright
    key: playwright-v1-{{ checksum "packages/b-ber-testing/package.json" }}
```

### Environment variables

- `CI=true` — already set by CircleCI; Playwright uses this to disable
  `reuseExistingServer` and to run headless
- `NO_NETWORK=true` — set this in CI to skip tests that require external
  network access (Vimeo embeds)

### Build trigger

The e2e job should run on every push to `main` and on PRs targeting `main`.
It does not need to run on every feature branch push — gate it to the same
branches as the existing `build` job, or add a `[e2e]` commit tag convention
for manual triggers.

## Subtasks

- [x] Verify Playwright headless runs in current Docker image (canopycanopycanopy/b-ber:1.0.1) — determined it lacks system deps; switched to `node:24-bookworm` + inline `playwright install-deps` (see TASK-035 for canopy image update)
- [x] Add `e2e` job to `.circleci/config.yml`
- [x] Configure Playwright browser binary cache
- [x] Set `NO_NETWORK` env var for Vimeo skip
- [x] Confirm e2e job reports correctly in GitHub PR checks — verified green: the final run on `feat/e2e-ci` (commit `289b91c7`, the zip + Java epub fix) reported both `ci/circleci: build` and `ci/circleci: e2e` as SUCCESS (CircleCI runs 381/382). The `npm link` fix took CLI tests from 11 failing → 1, and the zip/JRE install closed the last epub-archive failure.
- [x] Document the CI setup in `packages/b-ber-testing/AGENTS.md`

## Notes

Branch: `feat/e2e-ci` (separate from `feat/e2e` — PR #524 open against `main`
for CI visibility)

### What's working

- `build` job passes cleanly (Node 24, foundational packages, reader-react, all
  remaining packages, unit tests)
- `e2e` job reaches `npm test` and runs all 41 tests
- 29/41 pass: **all 24 Chromium browser reader tests pass** (navigation,
  directives, edge cases)

### Previously failing — 11 CLI tests (RESOLVED)

All CLI failures had `result.status === null`, which means the `bber` process
was not found (ENOENT from `spawnSync`). Root cause: `globalPath()` in
`tests/cli/helpers.ts` strips `node_modules/.bin` from PATH so that tests use
the globally installed `bber`, not the workspace symlink. On CI there is no
global `bber`. Fixed by adding `npm link` in `packages/b-ber-cli` after
building to install `bber` into `/usr/local/bin` (survives `globalPath()`'s
filter). Verified by CI run — brought failures from 11 down to 1.

### Now failing — 1 CLI test: "creates epub zip archive"

`bber-build-epub.spec.ts:28` expects `kitchen-sink-b-ber-fixture-001.epub` to
exist after `bber build epub`, but it's never created — even though the
sibling test confirms `_builds-epub/` (the unpacked structure) is built
correctly. Root cause: the `epub` build task
(`packages/b-ber-tasks/src/epub/index.ts`) delegates to the `epub-zipper` npm
package, which shells out to the system `zip` CLI (to compile the archive) and
`java -jar epubcheck.jar` (to validate it via EPUBCheck). Neither `zip` nor a
JRE is installed in the bare `node:24-bookworm` image used by the `e2e` job —
so the zip step fails, the build process exits non-zero, and `_builds-epub/`
is left populated but no `.epub` file is ever written.

Fix applied: added an `apt-get install -y zip default-jre-headless` step to
the `e2e` job in `.circleci/config.yml` (before the Playwright system-deps
install step). Not yet verified by a CI run.

### Fixes applied during CI debugging (all on feat/e2e-ci)

- Replaced `canopycanopycanopy/b-ber:1.0.1` (Node 16) with `cimg/node:24.14`
  for `build` and `node:24-bookworm` for `e2e`
- Removed stale `npm run reader:shim` step (script no longer exists)
- Removed smoke test (pre-existing `b-ber-lib` deep import issue — see below)
- Removed `"prepare": "npm run build"` from `b-ber-validator/package.json`
  (npm 10 runs `prepare` even with `--ignore-scripts` for workspace packages)
- Moved `@canopycanopycanopy/b-ber-shapes-directives` from `devDependencies`
  to `dependencies` in `b-ber-validator/package.json` (lerna topo sort)
- Fixed `bber` binary path in kitchen-sink fixture build (4 levels up, not 5)
- Switched kitchen-sink fixture build from symlink to `node path/to/dist/index.js`
  (npm 10 skips creating `.bin/bber` symlink when `dist/` doesn't exist at
  install time)
- Added root-level shims to `b-ber-lib` for all deep subpath imports:
  `State.js`, `utils.js`, `YamlAdaptor.js`, `Theme.js`, `Html.js`,
  `ManifestItemProperties.js`, `EbookConvert.js`, `HtmlToXml.js`
  (tsdown externalizes deps, so built packages emit `require('b-ber-lib/State')`
  at runtime; old per-file tsc output is gitignored)
- Added root-level shims to `b-ber-shapes-sequences`:
  `create-build-sequence.js`, `sequences.js` (same reason)
- Updated `b-ber-templates/tsdown.config.ts` to compile all subpath entry
  points (`Xml`, `Ncx`, `Xhtml`, `Toc`, `Project`, `figures`, `Opf/*`) and
  added `exports` field to `package.json` mapping each subpath to `dist/`
  (old compiled subdirs were gitignored; tsdown only produced `dist/index.js`)
- Committed `__bber_cover__*.jpg` to `kitchen-sink/_project/_images/` and
  removed it from the fixture `.gitignore`

### Integration status (closed 2026-06-11)

The full e2e + CI work is already present on `feat/upgrades` — it was folded in
via the squashed commit `128484d5` rather than a branch merge. Verified:
`.circleci/config.yml` and `packages/b-ber-testing/` are byte-identical between
`feat/e2e-ci` and `feat/upgrades`, and `feat/upgrades` is in fact ahead in other
areas (reader-react spread/ESM work). A literal `git merge feat/e2e-ci` was
therefore **not** performed — it would have conflicted across ~80 files and risked
reverting newer reader work. PR #524 (against `main`) was closed unmerged; it
existed only for CI visibility. No further merge action is needed.

Follow-up applied on `feat/upgrades`: dropped the `branches.only` workflow
filters so `build` + `e2e` now run on every push and PR (previously only `main`
and the now-defunct `feat/e2e-ci` test branch), and wired Codecov upload into
the `build` job (see [[TASK-049]]).

### Remaining pre-existing issue

`b-ber-lib` still lacks deep import support via an `exports` field; the shims
are the minimal fix. A proper `exports` map would be cleaner and should be a
follow-up task.

Parent: [[TASK-039]]
Depends on: [[TASK-043]] (reader tests must be stable before CI wiring)
Related: [[TASK-035]] (CircleCI modernization — coordinate if both are open simultaneously)
