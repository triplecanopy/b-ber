# AGENTS.md — b-ber-grammar-section

## What This Is

Handles all block-container directives (chapter, part, subchapter, appendix, preface, and the full set of EPUB 3 Structural Semantics Vocabulary types in `BLOCK_DIRECTIVES`), plus exit. Opening directives emit `<section id="..." ...>` with HTML start comments; exit directives emit `</section>` with end comments and remove the id from `state.cursor`. Special cases: for `gallery` and `spread` directives in reader/web builds, exit emits additional closing tags to match the multi-element scaffold opened by those packages. Delegates open/close id validation to `createRenderer` from `b-ber-grammar-renderer`.

**Since TASK-174 the build parses these blocks with b-ber-markdown-renderer's directive rule** (`src/directives`), and uses only this package's `render`, called with tokens shaped as b-ber-parser-section made them. The exported `plugin` (b-ber-parser-section) and `validateOpen` are no longer used by the build; they are kept until the packages are consolidated (TASK-179).

## Key Files

| File                      | Purpose                                                                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`            | Full implementation — `openElement`, `closeElement`, `handleExitDirective`, `isGallery`, `isSpread`, `render`, exported directive object |
| `__tests__/index.test.js` | Jest tests                                                                                                                               |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All transforms are synchronous
- Special-case exit handling for `gallery` and `spread`, where the target has `fullbleedContainers`, must stay in sync with the opening HTML emitted by those packages. The spread marker `<div>` follows `readerRuntime`
- The `containers` variable is built dynamically from `BLOCK_DIRECTIVES` — do not hardcode directive names here
