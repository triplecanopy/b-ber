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

The kitchen-sink EPUB and reader builds live in `fixtures/kitchen-sink/`. The fixture is pre-built and checked in — it exercises every b-ber directive (section, footnotes, figure, gallery, spread, audio, video, iframe, dialogue, pullquote, logo, frontmatter, vimeo). To rebuild it, see TASK-041.

## CI

Set `NO_NETWORK=1` to skip the Vimeo test (which requires outbound network access). The `npx playwright install chromium` step must run before `npx playwright test` in CI.
