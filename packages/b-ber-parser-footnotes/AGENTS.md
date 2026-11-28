# AGENTS.md — b-ber-parser-footnotes

## What This Is

A markdown-it plugin (adapted from markdown-it-footnote 3.0.1) that parses inline (`^[…]`) and reference-style (`[^label]` / `[^label]: …`) footnotes and renders them as EPUB-compatible HTML with `epub:type="noteref"` and `epub:type="footnote"` attributes. After tokenising all footnotes it strips them from the main token stream and passes them to a callback, allowing the build pipeline to write a separate `notes.xhtml` file. A `Counter` class manages list numbering across documents, with optional cross-document grouping. The callback is given the render's env as well.

## Key Files

| File                      | Purpose                                                                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`            | Plugin entry point; block rule (`footnote_def`), inline rules (`footnote_inline`, `footnote_ref`), core rule (`footnote_tail`), all renderer rules |
| `src/counter.ts`          | `Counter` class tracking footnote list start values and generating unique hash-based reference IDs                                                 |
| `__tests__/index.test.js` | Test file (placeholder only — contains `test.todo`)                                                                                                |

## Dev Commands

```
npm test   # runs jest (suite has only todo placeholders — no assertions yet)
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- The plugin callback pattern (second argument to `md.use`) is specific to this parser; it is not a markdown-it convention
- `Counter` uses class field syntax (`setRef = …`, `getRef = …`)
- **The `Counter` is the book's, not the module's.** Under `group_footnotes: false` notes are numbered across the whole book, which five published books rely on, so the build makes one per render task and every render rule reads it from `env.document.footnotes`, with `group_footnotes` and the footnote page count (TASK-177). It was a module-level singleton, which concurrent targets would advance for each other (TASK-160's spike); TASK-166 moves it onto the build context
- The module exports using `export default` (ES module); the Counter also uses ES module `export default`
