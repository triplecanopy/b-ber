# TASK-043: E2E testing — reader browser tests (Playwright)

**Status:** complete
**Scope:** monorepo
**Priority:** high
**GitHub Issue:** #522 — https://github.com/triplecanopy/b-ber/issues/522

## Description

Implement the browser-driven layer of the e2e test suite (Area B from TASK-039).
Use Playwright against the b-ber-reader-react app served from the kitchen-sink
reader build produced by TASK-041.

### Setup

`playwright.config.ts` in `packages/b-ber-testing/` defines a `webServer` array
that starts:
1. A static content server (`scripts/content-server.js`) on port 4000 serving
   the kitchen-sink reader build
2. The Vite dev server (b-ber-reader-react, `vite.config.e2e.js`) on port 3000,
   with `VITE_MANIFEST_URL` injected via the `env` option

`dev/index.e2e.jsx` reads `VITE_MANIFEST_URL` from the environment and mounts
the Reader. `vite.config.e2e.js` uses `transformIndexHtml: { order: 'pre' }` to
swap the entry point before Vite's internal transforms run.

Tests run in `tests/e2e/reader/`. Browser is Chromium only.

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
- Direct URL deep-link to chapter 02 loads correct content

**Directive rendering**

Each directive has at least one assertion that it rendered correctly:

| Directive   | Assert                                             | Chapter        |
| ----------- | -------------------------------------------------- | -------------- |
| section     | `section.chapter h1` contains "Chapter One"        | chapter-01     |
| footnotes   | `.footnote-ref` present (span wrapper from process-nodes) | chapter-01 |
| figure      | `figure img` visible                               | chapter-01     |
| pullquote   | `section.pullquote` present                        | chapter-01     |
| dialogue    | `section.dialogue` present                         | chapter-02     |
| gallery     | `section.gallery` present; 2 figure elements       | chapter-02     |
| spread      | `.spread__content` present (figure element)        | chapter-02     |
| iframe      | `iframe` present                                   | figures-titlepage |
| audio       | `audio` present                                    | figures-titlepage |
| video       | `video` present                                    | figures-titlepage |
| vimeo       | `div.vimeo` present (data-vimeo removed by process-nodes) | figures-titlepage |
| logo        | `figure.logo` present                              | colophon       |
| frontmatter | `h1` contains "Kitchen Sink"                       | title-page     |

**Edge cases**

- First chapter hides the chapter-prev button
- Last chapter hides the chapter-next button
- Direct URL deep-link to chapter 02 loads correct content without passing
  through chapter 01
- Chapter-next is absent when navigating to the last chapter via next button

## Subtasks

- [x] Install and configure `@playwright/test` in `packages/b-ber-testing/`
- [x] Write `playwright.config.ts` with dual `webServer` block
- [x] Write `vite.config.e2e.js` with `transformIndexHtml: { order: 'pre' }` swap
- [x] Write `dev/index.e2e.jsx` reading `VITE_MANIFEST_URL` from env
- [x] Navigation journey tests
- [x] Directive rendering assertions
- [x] Edge case tests (first/last chapter, deep link)
- [x] Wire up to `npm test` in the testing package
- [ ] `npx playwright install chromium` added to CI step (TASK-044)

## Notes

Branch: `feat/e2e`

**Slug derivation**: Reader slugs come from `Url.slug(navLabel.text)` via the
NCX. They are NOT the XHTML filenames. The cover has no NCX entry so its slug
is ''. Example: chapter-02 filename `kitchen-sink-chapter-02.xhtml` → NCX title
"Chapter Two" → slug `chapter-two`.

**Footnote rendering**: `a[epub:type="noteref"]` is transformed by
`process-nodes.js` into `<span class="footnote-ref"><a ...>`. Use `.footnote-ref`
not `a.footnote-ref`.

**Spread rendering**: `SpreadFigure.jsx` renders the `div.spread__content` as a
`<figure>`. Use `.spread__content` not `div.spread__content`.

**Vimeo rendering**: `process-nodes.js` removes the `data-vimeo` attribute from
the rendered element. Use `div.vimeo` (outer container) instead.

**TOC click**: Playwright's pointer-event-based `.click()` is intercepted by the
reader's column layout. Use `.evaluate(el => el.click())` for the TOC button.

**`waitForReader` helper**: Waits for `footer.bber-controls__footer` visible AND
`.bber-spinner--visible` hidden. The spinner disappears when `Ultimate.jsx`
confirms layout stability, at which point the spine is fully loaded and
navigation buttons are correctly shown/hidden.

Parent: [[TASK-039]]
Depends on: [[TASK-040]] (tooling), [[TASK-041]] (fixture + reader build)
