# AGENTS.md — b-ber-grammar-gallery

## What This Is

Transforms the `gallery` / `exit` block directive pair into a build-target-aware HTML container. For `reader` and `web` builds emits a full-bleed gallery scaffold; for EPUB/Mobi/PDF emits a plain `<section>`. The exit directive is handled by `b-ber-grammar-section`'s exit logic, which closes the appropriate number of elements based on the stored cursor state. Delegates open/close validation to `b-ber-grammar-renderer` and uses `b-ber-parser-gallery` as the MarkdownIt plugin.

## Key Files

| File                      | Purpose                                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `src/index.ts`            | Full implementation — `render` function with build-type switch, exported directive object |
| `__tests__/index.test.js` | Jest tests                                                                                |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All transforms are synchronous
- Build-target branching is in the `render` function switch statement; closing HTML for reader/web builds is emitted by `b-ber-grammar-section`'s exit handler
