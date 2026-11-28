# AGENTS.md — b-ber-grammar-renderer

## What This Is

The shared MarkdownIt container plugin factory for block-level directives. `createRenderer({ context, render, markerOpen, markerClose })` returns a configuration object consumed by `markdown-it-container`. The `validateOpen` method checks that a directive has an id. It no longer records ids: the build's directive rule pairs blocks and checks ids per file (TASK-175), and does not call `validateOpen`. The `render` function is provided by the calling grammar package and is responsible for emitting the actual HTML.

## Key Files

| File                      | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| `src/index.ts`            | Single export `createRenderer` — the renderer factory |
| `__tests__/index.test.js` | Jest tests                                            |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All logic is synchronous
- Open blocks are tracked by b-ber-markdown-renderer's directive rule, not here. `state.cursor` was removed in TASK-175
- The default `context = {}` assignment exists specifically for test environments where context is not available
