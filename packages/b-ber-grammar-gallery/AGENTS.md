# AGENTS.md — b-ber-grammar-gallery

## What This Is

Transforms the `gallery` / `exit` block directive pair into a build-target-aware HTML container. For `reader` and `web` builds emits a full-bleed gallery scaffold; for EPUB/Mobi/PDF emits a plain `<section>`. Since TASK-175 the build parses it with b-ber-markdown-renderer's directive rule, and since TASK-176 `render` builds the whole gallery as elements, from the rule's node and its rendered children; its close used to be b-ber-grammar-section's, drawn at the exit. Delegates open/close validation to `b-ber-grammar-renderer` and uses `b-ber-parser-gallery` as the MarkdownIt plugin.

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
- The full-bleed container opens in `render` where `env.document.target.features.fullbleedContainers` is set (web, reader), and is closed in the same place
