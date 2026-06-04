# AGENTS.md — b-ber-grammar-section

## What This Is

Handles all block-container directives (chapter, part, subchapter, appendix, preface, and the full set of EPUB 3 Structural Semantics Vocabulary types in `BLOCK_DIRECTIVES`), plus exit. Opening directives emit `<section id="..." ...>` with HTML start comments; exit directives emit `</section>` with end comments and remove the id from `state.cursor`. Special cases: for `gallery` and `spread` directives in reader/web builds, exit emits additional closing tags to match the multi-element scaffold opened by those packages. Delegates open/close id validation to `createRenderer` from `b-ber-grammar-renderer`.

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
- Special-case exit handling for `gallery` and `spread` in reader/web builds must stay in sync with the opening HTML emitted by those packages
- The `containers` variable is built dynamically from `BLOCK_DIRECTIVES` — do not hardcode directive names here

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the root AGENTS.md. No tasks are currently open. To add a task, create tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
