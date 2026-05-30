# AGENTS.md — b-ber-grammar-vimeo

## What This Is

Transforms `vimeo` and `vimeo-inline` directives into Vimeo embed HTML. The `vimeo` form adds a figure entry to state and emits a thumbnail; `vimeo-inline` emits a full `<iframe>` pointing to the Vimeo player with validated query-string parameters for `reader`/`web` builds. Unsupported builds receive a poster-image fallback block. Vimeo player parameters are validated against known types (boolean coercion, regex validation for color, quality, texttrack, and time codes) via `vimeoAttributesTransformer`. The `bBerAttributes` filter separates b-ber-internal attributes (classes, aspectratio) from Vimeo player parameters.

## Key Files

| File                      | Purpose                                                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.js`            | Entry point — `prepare()`, `render()` dispatcher, exported directive object                                                                                 |
| `src/helpers.js`          | `createVimeo`, `createVimeoInline`, `createUnsupportedInline`, `vimeoAttributesTransformer`, `transformAttributes`, `validatePosterImage`, `bBerAttributes` |
| `__tests__/index.test.js` | Jest tests                                                                                                                                                  |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All transforms are synchronous
- Vimeo player parameters must be validated through `vimeoAttributesTransformer` before being added to the query string; do not bypass this
- `bBerAttributes` is used to filter b-ber-internal attributes out of the rendered HTML element class/style attributes

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the root AGENTS.md. No tasks are currently open. To add a task, create tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
