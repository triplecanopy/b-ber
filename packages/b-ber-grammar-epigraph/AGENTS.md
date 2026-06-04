# AGENTS.md — b-ber-grammar-epigraph

## What This Is

Transforms the `epigraph` inline directive into EPUB-compliant HTML. Supports two forms: image-based (emits `<section epub:type="epigraph">` with a full-width figure) and text-only (emits one or more `<div class="pullquote full-width">` blocks with optional citations). Pipe-delimited values in `caption` and `citation` attributes produce multiple blocks. Does not use `createRenderer` — implements the MarkdownIt container render callback directly.

## Key Files

| File                      | Purpose                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`            | Full implementation including regex parsing of `image`, `caption`, and `citation` named attributes and HTML generation |
| `__tests__/index.test.js` | Jest tests                                                                                                             |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All transforms are synchronous
- Does not depend on `b-ber-grammar-renderer`; implements the MarkdownIt renderer callback directly
- The `attrsRe` regex uses the `g` flag with a `while` loop — maintain this pattern when modifying attribute parsing

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the root AGENTS.md. No tasks are currently open. To add a task, create tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
