# AGENTS.md — b-ber-grammar-iframe

## What This Is

Transforms `iframe` and `iframe-inline` directives into HTML. The `iframe` form collects a figure entry in `env.result.figures` and emits a thumbnail linking to the figure page (LOI). The `iframe-inline` form emits a full `<iframe>` element with attributes (`allow`, `frameborder`, `height`, `width`, `title`) for `reader`/`web` builds; other builds receive an unsupported-content block from `b-ber-lib/utils`. Attribute preparation and validation are handled in `src/helpers.ts`.

## Key Files

| File                      | Purpose                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| `src/index.ts`            | Entry point — `render` dispatcher, exported directive object         |
| `src/helpers.ts`          | `prepare()`, `createIframe()`, `createIframeInline()`, `supported()` |
| `__tests__/index.test.js` | Jest tests                                                           |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All transforms are synchronous
- The target's `liveEmbeds` feature determines whether inline rendering is available; other targets receive a placeholder from `b-ber-lib/utils`
- Standard iframe HTML attributes are filtered through `htmlIframeAttributes` from `b-ber-shapes-directives`
