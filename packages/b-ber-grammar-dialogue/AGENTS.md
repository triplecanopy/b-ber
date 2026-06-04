# AGENTS.md — b-ber-grammar-dialogue

## What This Is

Transforms the `dialogue` / `exit` block directive pair into a `<section>` wrapper. Opening marker produces `<section id="..." class="...">` with EPUB-compliant attributes; exit marker closes it. Delegates the open/close state-tracking and MarkdownIt container validation to `b-ber-grammar-renderer`. The content between markers is rendered as normal Markdown.

## Key Files

| File                      | Purpose                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `src/index.ts`            | Full implementation — `handleOpen`, `handleClose`, `render`, exported directive object |
| `__tests__/index.test.js` | Jest tests                                                                             |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All transforms are synchronous
- Uses `createRenderer` from `b-ber-grammar-renderer` for open/close validation; do not reimplement that logic here

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the root AGENTS.md. No tasks are currently open. To add a task, create tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
