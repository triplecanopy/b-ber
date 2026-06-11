# TASK-004: Improve monorepo-wide test coverage

**Status:** in progress
**Scope:** monorepo
**Priority:** high
**GitHub Issue:** #471 — https://github.com/triplecanopy/b-ber/issues/471

**Feature:** Unit test coverage (epic)

## Description

Test coverage across the monorepo is uneven. The goal is **≥ 75% statement
coverage repo-wide** (raised from 60% on 2026-06-02), measured by
`npm run test:coverage` (collection scoped to `packages/*/src`). The goal is
not 100% everywhere — it is behavioral coverage: every meaningful code path
that could break during a refactor must have a test that catches the breakage.

This is the **epic** for all unit-test work. The previously-separate
per-package coverage tasks (the 26 `packages/*/tasks/TASK-001` stubs and the
reader-react coverage task) were consolidated into the checklist below on
2026-06-11; those files were removed.

## Per-package status (regenerate with `npm run test:coverage`)

Statement coverage as of 2026-06-11. Check the box when a package reaches the
75% target. Packages already at target are checked.

- [x] b-ber-grammar-attributes — 99%
- [x] b-ber-grammar-audio-video — 82%
- [x] b-ber-grammar-dialogue — 93%
- [x] b-ber-grammar-epigraph — 96%
- [x] b-ber-grammar-footnotes — 100%
- [x] b-ber-grammar-frontmatter — 100%
- [x] b-ber-grammar-gallery — 100%
- [x] b-ber-grammar-iframe — 99%
- [x] b-ber-grammar-image — 98% (2026-06-11: added image.ts createFigure/createFigureInline tests + index.ts branch coverage)
- [x] b-ber-grammar-logo — 100%
- [x] b-ber-grammar-media — 96%
- [x] b-ber-grammar-pullquote — 98% (2026-06-11: covered duplicate-id check, citation/footer handling, and exit-id mismatch in handleClose)
- [x] b-ber-grammar-renderer — 100%
- [x] b-ber-grammar-section — 78%
- [x] b-ber-grammar-spread — 100%
- [x] b-ber-grammar-vimeo — 80%
- [x] b-ber-parser-dialogue — 96%
- [x] b-ber-parser-figure — 99%
- [x] b-ber-parser-footnotes — 77%
- [x] b-ber-parser-gallery — 82%
- [x] b-ber-parser-section — 94%
- [x] b-ber-shapes-directives — 100%
- [x] b-ber-shapes-dublin-core — 100%
- [x] b-ber-shapes-sequences — 100% (2026-06-11: added createBuildSequence
      tests and re-export/xml-sequence coverage in index.test.js)
- [x] b-ber-markdown-renderer — 92%
- [x] b-ber-templates — 96%
- [x] b-ber-validator — 92%
- [x] b-ber-lib — 76%
- [x] b-ber-logger — 77%
- [ ] b-ber-cli — 54% (see TASK-050 for handler tests)
- [ ] b-ber-tasks — 13% (realistic ceiling ~25%: pipeline steps need a full
      project + Calibre/wkhtmltopdf; tracked as an accepted exception)
- [x] b-ber-reader-react — 80% (2026-06-11: actions/reducers 0-72% -> 100%,
      helpers Cache/DOM/Request/Storage/search-params/media 0-28% -> 100%,
      lib transition-styles/spread-context/version/polyfills/custom-prop-types
      0-65% -> 94-100%, components/Reader/navigation.js + resize.js 0% -> 100%,
      components/Sidebar/* + hooks/use-max-height 0% -> 100%,
      components/Media/{Iframe,Vimeo,VimeoPlayerControls,VimeoPosterImage,
      Audio,Video,AudioElement,VideoElement} -> 100%, components/Media/Media.jsx
      16% -> 98%, components/Media/Controls/* -> 100%,
      components/Reader/loader.js 0% -> 100%, components/Reader/index.jsx
      0% -> 83%, helpers/XMLAdaptor.js 0% -> 99%. NOTE: the previously-recorded
      "90%" figure was computed with a narrower --collectCoverageFrom than the
      root jest.config's default ('packages/*/src/**/*.{js,jsx,ts,tsx}'); the
      true package-wide figure under that default went 72% -> 80%, now past
      the 75% target. Remaining gaps (real, currently 15-26%):
      lib/with-node-position.jsx (335 lines, 19%), lib/process-nodes.js
      (328 lines, 17%), lib/with-iframe-position.jsx (113 lines, 17%),
      lib/request-animation-frame.js (43 lines, 26%), models/Script.js
      (44 lines, 15%); also lib/DocumentPreProcessor.js (68%),
      lib/DocumentProcessor.js (81%), helpers/Url.js (74%), helpers/Viewport.js
      (76%).)
- [ ] b-ber-resources — 0% (mostly static asset paths; assess if worth testing)
- [ ] b-ber-reader (legacy) — 0% (legacy non-React reader; likely excluded)

- [ ] Re-run `npm run test:coverage` and confirm overall statement coverage
      ≥ 75% before closing this epic.

Related leaf tasks: [[TASK-050]] (CLI handler tests), [[TASK-051]] (SCSS/theme
tests). The former reader-react coverage task was merged into the checklist above.

## Notes

- Agents can write tests quickly. The bottleneck is knowing _what_ to test,
  not writing the code. Spend time on the audit and test specification before
  generating test code.
- For grammar and parser packages, the most valuable tests are input/output
  snapshot tests: feed a Markdown string with a directive in, assert the HTML
  out matches a fixed snapshot. These are cheap to write and catch regressions
  immediately.
- For `b-ber-reader-react`, behavioral tests (user interaction → state change →
  rendered output) are more valuable than shallow render snapshots.
- This task must be substantially complete before the JS→TS migration (TASK-002)
  begins implementation. A package without meaningful tests should not be
  converted to TypeScript — the type-checker alone is not a substitute for
  behavioral tests.
- Coverage tooling: if Jest is already in use, `--coverage` with `c8` or
  `istanbul` is the path of least resistance. Do not introduce a new test
  framework in this task.
