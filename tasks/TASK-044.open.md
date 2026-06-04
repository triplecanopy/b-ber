# TASK-044: E2E testing — CI integration (CircleCI, Playwright cache)

**Status:** not started
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

- [ ] Verify Playwright headless runs in current Docker image (canopycanopycanopy/b-ber:1.0.1)
- [ ] Add `e2e` job to `.circleci/config.yml`
- [ ] Configure Playwright browser binary cache
- [ ] Set `NO_NETWORK` env var for Vimeo skip
- [ ] Confirm e2e job reports correctly in GitHub PR checks
- [ ] Document the CI setup in `packages/b-ber-testing/AGENTS.md`

## Notes

Branch: `feat/e2e-ci` (separate from `feat/e2e` so CI config changes are
independently reviewable and revertable)

The current Docker image (`canopycanopycanopy/b-ber:1.0.1`) is known stale
(TASK-035). If TASK-035 is resolved before this task, use the updated image.
If not, verify that Playwright's Chromium headless binary runs in the existing
image — it requires shared libraries (`libglib`, `libnss`, etc.) that may not
be present. The Playwright docs list the required system deps; add them to the
Docker image or switch to the official `mcr.microsoft.com/playwright` base image
for the e2e job.

Parent: [[TASK-039]]
Depends on: [[TASK-043]] (reader tests must be stable before CI wiring)
Related: [[TASK-035]] (CircleCI modernization — coordinate if both are open simultaneously)
