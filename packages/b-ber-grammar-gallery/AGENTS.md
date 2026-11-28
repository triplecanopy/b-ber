# AGENTS.md — b-ber-grammar-gallery

## What This Is

Transforms the `gallery` / `exit` block directive pair into a build-target-aware HTML container. For `reader` and `web` builds emits a full-bleed gallery scaffold; for EPUB/Mobi/PDF emits a plain `<section>`. Its close is drawn by `b-ber-grammar-section`'s `close`, which closes the full-bleed scaffold where the target has one. Since TASK-175 the build parses it with b-ber-markdown-renderer's directive rule, and `close` takes the block from the rule's node. Delegates open/close validation to `b-ber-grammar-renderer` and uses `b-ber-parser-gallery` as the MarkdownIt plugin.

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
- The full-bleed container opens in `render` where `env.document.target.features.fullbleedContainers` is set (web, reader); its closing HTML is emitted by `b-ber-grammar-section`'s exit handler
