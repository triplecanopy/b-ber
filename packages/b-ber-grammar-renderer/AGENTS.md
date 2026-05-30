# AGENTS.md — b-ber-grammar-renderer

## What This Is

The shared MarkdownIt container plugin factory for block-level directives. `createRenderer({ context, render, markerOpen, markerClose })` returns a configuration object consumed by `markdown-it-container`. The `validateOpen` method tracks opening directive ids in `state.cursor`, enforces uniqueness, and validates that exit directives close a previously opened id. The `render` function is provided by the calling grammar package and is responsible for emitting the actual HTML.

## Key Files

| File                      | Purpose                                               |
| ------------------------- | ----------------------------------------------------- |
| `src/index.js`            | Single export `createRenderer` — the renderer factory |
| `__tests__/index.test.js` | Jest tests                                            |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All logic is synchronous
- `state.cursor` is the source of truth for open directive tracking; do not duplicate this logic in calling packages
- The default `context = {}` assignment exists specifically for test environments where context is not available

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the root AGENTS.md. No tasks are currently open. To add a task, create tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
