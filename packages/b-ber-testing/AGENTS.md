# AGENTS.md — b-ber-testing

## What This Is

`b-ber-testing` is the end-to-end and integration test package for the b-ber
monorepo. It uses [Playwright](https://playwright.dev) to run two projects:

- **`cli`** (`tests/cli/`) — synchronous CLI smoke tests that run `bber`
  commands against a copy of the kitchen-sink fixture and assert on exit codes
  and output files.
- **`chromium`** (`tests/e2e/reader/`) — browser tests that drive
  `b-ber-reader-react` in Chromium, covering navigation, directive rendering,
  and edge cases.

### How the E2E suite works

```
globalSetup.ts builds the kitchen-sink fixture (if not already built)
  → playwright.config.ts starts two webServers:
      scripts/content-server.js  (port 4000) serves the reader fixture files
      b-ber-reader-react + vite.config.e2e.js  (port 3000) serves the reader app
          → VITE_MANIFEST_URL injected via webServer.env
          → dev/index.e2e.jsx mounts Reader with VITE_MANIFEST_URL
  → tests run against http://localhost:3000
  → servers stop when the suite finishes
```

### Key files

| File / Dir                             | Purpose                                                   |
| -------------------------------------- | --------------------------------------------------------- |
| `playwright.config.ts`                 | Playwright config: webServer, projects, timeout           |
| `scripts/content-server.js`            | Static HTTP server for the kitchen-sink reader build      |
| `tests/e2e/globalSetup.ts`             | Pre-suite setup (fixture build check)                     |
| `tests/e2e/reader/helpers.ts`          | Shared locators, SPINE constants, `waitForReader`, `goToChapter` |
| `tests/e2e/reader/navigation.spec.ts`  | Navigation journey tests                                  |
| `tests/e2e/reader/directives.spec.ts`  | One assertion per b-ber directive                         |
| `tests/e2e/reader/edge-cases.spec.ts`  | First/last chapter buttons, deep links                    |
| `tests/cli/`                           | CLI smoke tests                                           |
| `fixtures/kitchen-sink/`               | Pre-built EPUB + reader fixture (checked in)              |

---

## Dev Commands

```bash
# First-time: install Chromium
npm run test:install

# Run all tests (cli + chromium projects)
npx playwright test

# E2E reader tests only
npx playwright test --project=chromium

# CLI smoke tests only
npx playwright test --project=cli

# Single spec
npx playwright test tests/e2e/reader/navigation.spec.ts

# Filter by test name
npx playwright test --grep "TOC sidebar"

# Headed browser (for debugging)
npx playwright test --project=chromium --headed
```

---

## Architecture Notes

These describe the current state of the suite.

**SPINE slugs** — Reader slugs come from `Url.slug(navLabel.text)` applied to
the NCX `<navLabel>` title. They are **not** the XHTML filenames. Example:
`kitchen-sink-chapter-02.xhtml` → NCX title "Chapter Two" → slug `chapter-two`.
The cover has no NCX entry, so its slug is `''`.

**`waitForReader` helper** — Waits for `footer.bber-controls__footer` visible
AND `.bber-spinner--visible` hidden. The spinner hides when `Ultimate.jsx`
declares the layout stable, which is the earliest moment the spine is fully
loaded and navigation buttons reflect the correct state.

**Footnote rendering** — `process-nodes.js` transforms `a[epub:type="noteref"]`
into a `Footnote` component that renders `<span class="footnote-ref"><a ...>`.
Use `.footnote-ref` (the span), not `a.footnote-ref`.

**Spread rendering** — `SpreadFigure.jsx` renders the `div.spread__content`
node as a `<figure>`. Use `.spread__content`, not `div.spread__content`.

**Vimeo rendering** — `process-nodes.js` deletes the `data-vimeo` attribute
from the rendered iframe. Match `div.vimeo` (the outer container) instead.

**TOC button click** — Playwright's pointer-event-based `.click()` is
intercepted by the reader's column layout. Use
`.evaluate(el => el.click())` for header navigation buttons.

**Vimeo network skip** — Set `NO_NETWORK=1` to skip the Vimeo test in CI
environments without outbound network access.

---

## CI Integration (CircleCI)

The e2e suite runs in CircleCI as a separate `e2e` job defined in
`.circleci/config.yml`. It runs after the `build` job succeeds (`requires:
[build]`) and is gated to `main` only.

### Docker image

The `e2e` job uses `mcr.microsoft.com/playwright:v1.49.0-jammy` rather than
the main `canopycanopycanopy/b-ber:1.0.1` image. The canopy image predates
Playwright and lacks the system libraries Chromium headless requires (libglib,
libnss, etc.). Once TASK-035 updates the canopy image, this can be consolidated.

### Fixture build

`fixtures/kitchen-sink/_builds-reader/` is gitignored, so the reader fixture
must be built in CI before tests run. The `e2e` job runs:

```
../../../../../node_modules/.bin/bber build reader
```

from the `fixtures/kitchen-sink/` directory. This pre-creates
`_builds-reader/manifest.json` so that `globalSetup.ts` skips its own build
step (`globalSetup` calls `bber` via `globalPath()`, which strips
`node_modules/.bin` from `PATH`; pre-building in CI avoids that limitation).

### Browser cache

Playwright's Chromium binary is cached under `~/.cache/ms-playwright` keyed on
the checksum of `packages/b-ber-testing/package.json`:

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

Bump the `playwright-v1` prefix if you need to force a cache bust (e.g. after
upgrading `@playwright/test`).

### Environment variables

| Variable     | Value    | Purpose                                           |
| ------------ | -------- | ------------------------------------------------- |
| `CI`         | `"true"` | Set by CircleCI; disables `reuseExistingServer`   |
| `NO_NETWORK` | `"true"` | Skips the Vimeo test (requires outbound internet) |

---

## Task System

Tasks for this package are tracked in the monorepo root `tasks/` directory
(not in a package-local `tasks/` folder) because this is a cross-cutting
concern. See root `AGENTS.md` for the full task system conventions.
