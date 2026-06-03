# TASK-028: Convert b-ber-markdown-renderer to TypeScript (+ replace vendored highlight.js)

**Status:** complete
**Scope:** b-ber-markdown-renderer
**Priority:** medium
**GitHub Issue:** #503 — https://github.com/triplecanopy/b-ber/issues/503

## Description

Convert `b-ber-markdown-renderer` from JavaScript to TypeScript. This package
wraps markdown-it with all b-ber grammar and parser plugins and exposes a
`MarkdownRenderer` class singleton used by `b-ber-tasks` to transform Markdown
source to XHTML.

The real source is a single file (`src/index.js`, ~115 LOC). However, the
package also contains 187 vendored highlight.js language files in
`src/highlightjs/` that must be addressed before this package can be cleanly
typed. This task includes research and replacement of those vendored files.

**This task must come after TASK-025 and TASK-026** — markdown-renderer imports
all 16 grammar packages and all 5 parser packages. Their types must be in place
first.

## Subtasks

- [x] **Research (do first):** Audit why highlight.js was vendored (see Notes).
      Confirm whether the CSS loading issue that motivated the vendoring is still
      a blocker. Check GitHub issue #234. Decide on replacement approach.
- [x] Replace `src/highlightjs/` with the `highlight.js` npm package: installed
      `highlight.js@^11.11.1` (ships own types); updated `src/index.ts` to use
      new API (`hljs.highlight(str, { language: lang })`); deleted all 187 vendored files
- [x] Add `@types/markdown-it` as dev dep
- [x] Rename `src/index.js` → `src/index.ts`; add type annotations to
      `MarkdownRenderer` class
- [x] Add tsdown build + update `package.json` `main`/`types` fields
- [x] Run `npm test` from root; verify no regressions (84/84 pass)

## Notes

Branch: `feat/ts-stage-2`

**highlight.js vendoring history:**
The 187 files in `src/highlightjs/` were added in commit `e5fcc901` ("Reduce
package size", July 2019). That same commit removed SCSS comments that said:
_"Eventually this will pull in the appropriate CSS from highlight.js. Currently
there's no way to use dynamic imports with SCSS, so this will either have to be
managed elsewhere"_ referencing GitHub issue #234. The vendoring was a
workaround for the inability to load highlight.js CSS themes via SCSS dynamic
imports — the JS language files came along as part of avoiding the npm
dependency entirely.

**Recommended replacement approach:**
`highlight.js@^11` ships its own TypeScript types and supports a core-only
import pattern that avoids bundling all languages:

```js
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
hljs.registerLanguage('bash', bash)
```

If only a subset of languages is actually used in practice, this also reduces
output bundle size. Audit which languages are registered in the current
`src/highlightjs/index.js` before choosing full vs selective import.

**CSS question to resolve during research:**
The original CSS loading issue was SCSS-specific. The b-ber theme packages use
SCSS for all styles. If highlight.js syntax-highlighting CSS is still needed,
it would be a build-time import (`@import 'highlight.js/styles/github.css'` or
equivalent). Verify whether any theme currently loads highlight.js CSS, or
whether the CSS was simply never implemented (the SCSS variable
`$syntax-highlighting` was planned but never shipped).

Parent: [[TASK-024]]
