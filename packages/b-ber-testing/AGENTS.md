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
globalSetup.ts rebuilds the kitchen-sink reader fixture with this checkout's CLI
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
| `tests/e2e/globalSetup.ts`             | Pre-suite setup: rebuilds the reader fixture              |
| `tests/e2e/reader/helpers.ts`          | Shared locators, SPINE constants, `waitForReader`, `goToChapter` |
| `tests/e2e/reader/navigation.spec.ts`  | Navigation journey tests                                  |
| `tests/e2e/reader/directives.spec.ts`  | One assertion per b-ber directive                         |
| `tests/e2e/reader/edge-cases.spec.ts`  | First/last chapter buttons, deep links                    |
| `tests/cli/`                           | CLI smoke tests                                           |
| `fixtures/kitchen-sink/`               | Source project; builds are generated and gitignored       |

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

**Which `bber` is tested** — always `packages/b-ber-cli/dist/index.js` from
this checkout, run with `node` (`BBER_BIN` in `tests/cli/helpers.ts`). Never a
global `bber` on `PATH`: that is whichever version was last installed, so a pass
would say nothing about the branch (TASK-130). Requires `npm run build` first;
`globalSetup` fails fast without it. Override with `BBER_BIN=<entry script>`.

**Skipped reader tests** — six navigation/edge-case tests are `test.skip`ped
because they fail on `main`, mostly by timing out at 120s. Reworking them is
TASK-131. Do not un-skip one without fixing it.

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

## CI Integration

**GitHub Actions** — the `e2e` job in `.github/workflows/ci.yml` runs on every
pull request and push to `main`: `npm ci`, `npm run build`, Chromium (cached by
Playwright version), then `npx playwright test`. On failure it uploads
`test-results/` (traces, screenshots). It is not yet a required check; see the
root AGENTS.md "Requiring the CI gate" once it has proven reliable.

**CircleCI** — also runs an `e2e` job, defined in `.circleci/config.yml`. Its
`npm link` and pre-build steps predate TASK-130 and are now redundant but
harmless. Retiring CircleCI in favour of Actions is TASK-118.

### Browser cache (CircleCI)

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
