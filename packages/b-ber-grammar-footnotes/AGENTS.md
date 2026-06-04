# AGENTS.md — b-ber-grammar-footnotes

## What This Is

A MarkdownIt core rule (not a container directive) that collects footnotes from the rendered token stream. After MarkdownIt processes a source file, the plugin wraps the token stream in a `<section class="footnotes break-after">` with a title heading drawn from the spine entry, renders the complete section to HTML, and stores `{ fileName, title, notes }` into `state.footnotes`. Actual footnote page files are generated later by `b-ber-parser-footnotes` reading from that state.

## Key Files

| File                      | Purpose                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------- |
| `src/index.ts`            | Single exported factory function `markdownItFootnotePlugin(self)` returning a MarkdownIt core rule |
| `__tests__/index.test.js` | Jest tests                                                                                         |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- This is a MarkdownIt core rule, not a container directive — it receives and mutates the full token array
- State side-effects (`state.add('footnotes', ...)`) are the intended output; no HTML string is returned from the plugin function itself

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the root AGENTS.md. No tasks are currently open. To add a task, create tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
