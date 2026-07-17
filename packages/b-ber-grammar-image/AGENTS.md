# AGENTS.md — b-ber-grammar-image

## What This Is

Transforms `figure` and `figure-inline` directives into image HTML. Reads image files from the project's `_images` directory, uses `image-size` to get pixel dimensions, computes orientation (portrait/landscape), registers a figure entry in `state.figures` for LOI generation, and emits either a thumbnail with a link to the figure page (`figure`) or a full inline figure via the `b-ber-templates` figure template (`figure-inline`). Both variants require non-empty `id` and `source` attributes.

## Key Files

| File                      | Purpose                                                                        |
| ------------------------- | ------------------------------------------------------------------------------ |
| `src/index.ts`            | Entry point — `prepare()`, `validate()`, `render()`, exported directive object |
| `src/image.ts`            | HTML builders: `createFigure()` and `createFigureInline()`                     |
| `__tests__/index.test.js` | Jest tests                                                                     |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- File system reads (`fs.existsSync`, `image-size`) happen synchronously at render time
- Figure state registration (`state.add('figures', ...)`) must happen before emitting HTML so that page order is correct
