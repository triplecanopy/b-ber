# `@canopycanopycanopy/b-ber-testing`

`b-ber-testing` is the end-to-end and integration test package for the b-ber monorepo. It uses [Playwright](https://playwright.dev) to run two test suites: CLI smoke tests that exercise `bber` commands against a pre-built kitchen-sink fixture, and browser tests that drive the `b-ber-reader-react` app in Chromium.

## Test suites

| Project    | Directory            | What it tests                                                  |
| ---------- | -------------------- | -------------------------------------------------------------- |
| `cli`      | `tests/cli/`         | `bber` CLI commands (epub, reader, pdf, mobi, etc.) run against the kitchen-sink fixture |
| `chromium` | `tests/e2e/reader/`  | Reader navigation, directive rendering, and edge cases in a real browser |

## Setup

Install Chromium (one-time):

```bash
npm run test:install
# or: npx playwright install chromium
```

## Running the tests

All commands run from `packages/b-ber-testing/`.

```bash
# Run everything (CLI + E2E reader)
npx playwright test

# E2E reader tests only
npx playwright test --project=chromium

# CLI smoke tests only
npx playwright test --project=cli

# A specific spec file
npx playwright test tests/e2e/reader/navigation.spec.ts

# A specific test by name
npx playwright test --grep "TOC sidebar"

# With headed browser (useful for debugging)
npx playwright test --project=chromium --headed
```

The servers start automatically before tests run and are torn down when they finish. The E2E suite starts two servers:

- **Content server** (`scripts/content-server.js`) on port 4000 — serves the pre-built kitchen-sink reader fixture
- **Vite dev server** (`b-ber-reader-react`, `vite.config.e2e.js`) on port 3000 — serves the reader app pointed at the fixture

## Fixture

`fixtures/kitchen-sink/` is a b-ber source project that exercises every directive (section, footnotes, figure, gallery, spread, audio, video, iframe, dialogue, pullquote, logo, frontmatter, vimeo). Only the source is checked in. Builds are generated and gitignored.

## Which `bber` is tested

Always this checkout's own CLI build, `packages/b-ber-cli/dist/index.js`, run with `node`. Never a global `bber` on `PATH`, which would be whatever version was last installed (TASK-130). Run `npm run build` at the repo root first; the suite fails fast if the CLI is not built. Set `BBER_BIN` to a CLI entry script to test a different build.

`globalSetup.ts` rebuilds the reader fixture on every run (under a second), so the browser tests never see output from an earlier checkout.

## CI

The suite runs in GitHub Actions as the `e2e` job in `.github/workflows/ci.yml`, on every pull request and on pushes to `main`. It is not yet a required check. CircleCI also has an `e2e` job; retiring CircleCI is TASK-118.

**Browser cache** — Chromium is cached in `~/.cache/ms-playwright` keyed on this package's `package.json` checksum. Re-download is only triggered when `@playwright/test` is bumped.

**Environment variables**

| Variable     | Value    | Effect                                          |
| ------------ | -------- | ----------------------------------------------- |
| `CI`         | `true`   | Disables `reuseExistingServer` in Playwright     |
| `NO_NETWORK` | `true`   | Skips the Vimeo test (requires outbound internet)|
