# AGENTS.md — b-ber-grammar-iframe

## What This Is

Transforms `iframe` and `iframe-inline` directives into HTML. The `iframe` form registers a figure entry in state and emits a thumbnail linking to the figure page (LOI). The `iframe-inline` form emits a full `<iframe>` element with attributes (`allow`, `frameborder`, `height`, `width`, `title`) for `reader`/`web` builds; other builds receive an unsupported-content block from `b-ber-lib/utils`. Attribute preparation and validation are handled in `src/helpers.js`.

## Key Files

| File                      | Purpose                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| `src/index.js`            | Entry point — `render` dispatcher, exported directive object         |
| `src/helpers.js`          | `prepare()`, `createIframe()`, `createIframeInline()`, `supported()` |
| `__tests__/index.test.js` | Jest tests                                                           |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All transforms are synchronous
- `supported(build)` determines whether inline rendering is available; unsupported builds receive a placeholder from `b-ber-lib/utils`
- Standard iframe HTML attributes are filtered through `htmlIframeAttributes` from `b-ber-shapes-directives`

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the root AGENTS.md. No tasks are currently open. To add a task, create tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
