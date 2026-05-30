# AGENTS.md — b-ber-grammar-spread

## What This Is

Transforms the `spread` / `exit` block directive pair into a full-bleed container. For `reader`/`web` builds emits a two-level `<div>` scaffold (`<div attrsString><div id="..." class="spread__content">`); for EPUB/Mobi/PDF emits a plain `<section>`. The exit is handled by `b-ber-grammar-section`, which emits the closing `</div></div>` pair plus (in reader builds) an empty `<div>` acting as a spread boundary marker. Delegates open/close id tracking to `createRenderer`.

## Key Files

| File                      | Purpose                                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `src/index.js`            | Full implementation — `render` function with build-type switch, exported directive object |
| `__tests__/index.test.js` | Jest tests                                                                                |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All transforms are synchronous
- The empty `<div>` appended by `b-ber-grammar-section` exit for reader builds is required by `b-ber-reader-react`'s spread detection logic — do not remove it
- Opening HTML for reader/web must stay in sync with the closing HTML in `b-ber-grammar-section`'s `isSpread` exit branch

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the root AGENTS.md. No tasks are currently open. To add a task, create tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
