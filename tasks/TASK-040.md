# TASK-040: E2E testing — research: tooling, fixture design, package boundary

**Status:** complete
**Feature:** E2E testing
**Scope:** monorepo
**Priority:** high
**GitHub Issue:** #510 — https://github.com/triplecanopy/b-ber/issues/510

## Description

Research task for TASK-039. Answer the three open questions before any
implementation begins:

### 1. Browser automation tool

Evaluate options for driving the reader app in a headless browser. Key
criteria: install size, speed, maintenance status, API ergonomics, CI
support, compatibility with the React + Redux reader stack.

**Candidates:**

| Tool                | Notes                                                                        |
| ------------------- | ---------------------------------------------------------------------------- |
| Playwright          | Microsoft-maintained, multi-browser, bundled browsers, fast parallel         |
| Cypress             | Popular, good DX, but heavier process model and Electron dep                 |
| Puppeteer           | Google-maintained, Chromium-only, leaner than Cypress                        |
| Vitest browser mode | Newer, Vite-native, but reader currently on webpack — revisit after TASK-006 |

Recommendation expected. Playwright is the leading candidate given its
maintained-by-a-major-org status, multi-browser support, and the fact that
its browser binaries are cached per-install (CI-friendly).

### 2. Fixture project design

Decide what the "kitchen sink" project looks like:

- What Markdown directives must be included (one instance of every custom
  b-ber directive: figure, footnote, dialogue, gallery, iframe, audio/video,
  epigraph, pullquote, spread, logo, frontmatter, section)
- What TOC depth is needed to test navigation (at least 3 chapters)
- Which build targets the fixture needs to exercise (epub + web + reader at
  minimum; pdf and mobi only if external deps are available in CI)
- Where the fixture lives: `packages/b-ber-testing/fixtures/kitchen-sink/`
  or a separate top-level `fixtures/` directory

### 3. Package boundary

Decide whether e2e tests live in an existing package or a new
`b-ber-testing` package:

- **New package** (`packages/b-ber-testing/`): clean separation, Playwright
  dep doesn't bloat existing packages, can have its own `npm test` and CI
  step
- **Root-level** (`e2e/` or `tests/`): simpler, no lerna config, but mixes
  concerns with the monorepo root

Playwright installs browser binaries separately via `npx playwright install`.
The package itself is ~5 MB; browsers are ~150–300 MB. This strongly favours
a dedicated package with its own `node_modules` rather than hoisting.

## Subtasks

- [x] Benchmark Playwright vs Cypress install size and cold-start speed
- [x] Confirm Playwright works with the current reader app (React + Vite + Redux)
- [x] Document the directive inventory (complete list from b-ber-grammar-\* packages)
- [x] Draft the kitchen-sink fixture project file list
- [x] Decide package boundary and record recommendation with rationale
- [x] Open implementation sub-tasks (TASK-041 through TASK-044) once decisions
      are made, updating their descriptions to reflect the chosen approach

## Notes

Branch: `feat/upgrades`

Parent: [[TASK-039]]

If Playwright is chosen, the setup is:

```bash
npm install --save-dev @playwright/test
npx playwright install chromium  # only chromium needed unless multi-browser
```

The reader app serves from a local port (default 4000 for the reader build).
Tests will need to start the server before running and shut it down after,
either via Playwright's `webServer` config option or a manual beforeAll/afterAll.

CLI tests do not need a browser — they can use Node's `child_process.spawn`
or the `execa` library to invoke the installed `bber` binary and assert on
exit codes + filesystem output.
