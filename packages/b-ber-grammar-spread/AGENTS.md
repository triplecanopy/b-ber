# AGENTS.md — b-ber-grammar-spread

## What This Is

Transforms the `spread` / `exit` block directive pair into a full-bleed container. For `reader`/`web` builds emits a two-level `<div>` scaffold (`<div attrsString><div id="..." class="spread__content">`); for EPUB/Mobi/PDF emits a plain `<section>`. `render` builds the whole spread as elements (TASK-176), scaffold and close together, plus (in reader builds) an empty `<div>` after it acting as a spread boundary marker. The close used to be b-ber-grammar-section's, drawn at the exit. Delegates open/close id tracking to `createRenderer`.

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
- The empty `<div>` after a spread in reader builds is required by `b-ber-reader-react`'s spread detection logic — do not remove it
