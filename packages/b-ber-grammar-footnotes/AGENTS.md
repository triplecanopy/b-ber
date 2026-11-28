# AGENTS.md — b-ber-grammar-footnotes

## What This Is

A MarkdownIt core rule (not a container directive) that collects footnotes from the rendered token stream. After MarkdownIt processes a source file, the plugin wraps the token stream in a `<section class="footnotes break-after">` with a title heading drawn from the spine entry, renders the complete section to HTML, and collects `{ fileName, title, notes }` into the render's `env.result.footnotes`. The title is the document's, from `env.document`. The build writes the entries to `state.footnotes`, from which the footnotes task writes the notes page.

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
- The entry collected in `env.result.footnotes` is the intended output; no HTML string is returned from the plugin function itself. The notes are rendered with the render's nested env, so that the book's footnote numbering reaches them
