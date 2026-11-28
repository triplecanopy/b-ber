# AGENTS.md — b-ber-grammar-section

## What This Is

Handles all block-container directives (chapter, part, subchapter, appendix, preface, and the full set of EPUB 3 Structural Semantics Vocabulary types in `BLOCK_DIRECTIVES`), plus exit. Opening directives emit `<section id="..." ...>` with HTML start comments; `close` emits `</section>` with end comments, from the directive rule's node, where the block closes (TASK-175). Special cases: for `gallery` and `spread` directives in reader/web builds, exit emits additional closing tags to match the multi-element scaffold opened by those packages. Delegates open/close id validation to `createRenderer` from `b-ber-grammar-renderer`.

**Since TASK-174 the build parses these blocks with b-ber-markdown-renderer's directive rule** (`src/directives`), and uses only this package's `render`. **Since TASK-176 `render` builds the whole block as elements** (b-ber-lib's `BlockRender`): it is called at the opener with the node, the env and the builder `h`, reads and checks the opener's attributes, and returns what builds the start comment, the `<section>` with its rendered children, and the end comment, once the children have rendered. It no longer works as a markdown-it render rule, so the exported `plugin` (b-ber-parser-section) does not render with it; it and `validateOpen` are kept until the packages are consolidated (TASK-179). `close` still draws the closing markup of dialogue, gallery and spread until their grammars build elements.

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
