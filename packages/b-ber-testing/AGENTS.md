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

## Task System

Tasks for this package are tracked in the monorepo root `tasks/` directory
(not in a package-local `tasks/` folder) because this is a cross-cutting
concern. See root `AGENTS.md` for the full task system conventions.
