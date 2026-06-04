# TASK-043: E2E testing — reader browser tests (Playwright)

**Status:** not started
**Scope:** monorepo
**Priority:** high
**GitHub Issue:** #522 — https://github.com/triplecanopy/b-ber/issues/522

## Description

Implement the browser-driven layer of the e2e test suite (Area B from TASK-039).
Use Playwright against the b-ber-reader-react app served from the kitchen-sink
reader build produced by TASK-041.

### Setup

`playwright.config.ts` in `packages/b-ber-testing/` defines a `webServer` block
that starts the Vite dev server (b-ber-reader-react) pointed at the pre-built
kitchen-sink reader output before any tests run:

```ts
webServer: {
  command: 'vite --config vite.config.js',
  url: 'http://localhost:3000',
  cwd: '../b-ber-reader-react',
  reuseExistingServer: !process.env.CI,
}
```

Tests run in `e2e/reader/`. Browser is Chromium only unless multi-browser
coverage is explicitly added later.

### Test cases

**Navigation**

- First chapter renders on initial load
- Footer next/prev chapter buttons advance and rewind the spine
- Keyboard arrow keys navigate pages within a chapter
- TOC sidebar opens on icon click; clicking a chapter entry navigates and closes
  the sidebar
- URL query string updates to reflect current spine position after each
  navigation
- `localStorage` persists the reader position across a `page.reload()`

**Directive rendering**

Each directive listed in TASK-041 must have at least one assertion that it
rendered correctly (element present in DOM, correct class, expected content):

| Directive   | Assert                                                      |
| ----------- | ----------------------------------------------------------- |
| section     | chapter `<h1>` visible and contains fixture title          |
| footnotes   | `a.footnote-ref` present; clicking navigates to note entry |
| figure      | `figure img` visible                                        |
| gallery     | `.gallery__item` count matches fixture (3)                  |
| spread      | `.figure__spread img` bounding box width fills viewport     |
| audio       | `.media__audio` element present                             |
| video       | `.media__video` element present                             |
| iframe      | `iframe` element present with correct `src`                 |
| dialogue    | `.dialogue` block present                                   |
| epigraph    | `.epigraph` block present                                   |
| pullquote   | `.pullquote` block present                                  |
| logo        | `.logo` block present                                       |
| frontmatter | title page renders expected title text                      |

**Edge cases**

- Navigating to the last chapter disables the "next chapter" button
- Navigating to the first chapter disables the "prev chapter" button
- Direct URL navigation (deep link to chapter 2) loads the correct content

## Subtasks

- [ ] Install and configure `@playwright/test` in `packages/b-ber-testing/`
- [ ] Write `playwright.config.ts` with `webServer` block
- [ ] Navigation journey tests
- [ ] Directive rendering assertions (one per directive row in the table above)
- [ ] Edge case tests (first/last chapter, deep link)
- [ ] `npx playwright install chromium` added to CI step (TASK-044)
- [ ] Wire up to `npm test` in the testing package

## Notes

Branch: `feat/e2e`

The reader uses URL query string params (not hash routing) for spine position.
Use `expect(page).toHaveURL(/chapter-02/)` or check the query string directly
depending on how the reader encodes the position — verify against the real app.

Vimeo embeds require network access. In CI, either allow network or mark the
Vimeo test with `test.skip` guarded by a `NO_NETWORK` env var.

Parent: [[TASK-039]]
Depends on: [[TASK-040]] (tooling), [[TASK-041]] (fixture + reader build)
