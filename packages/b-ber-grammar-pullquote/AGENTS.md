# AGENTS.md — b-ber-grammar-pullquote

## What This Is

Transforms `pullquote` and `blockquote` block directives (and their `exit` close markers) into `<section>` or `<blockquote>` elements with optional `<footer><cite>` citation blocks. `render` builds the whole block as elements (TASK-176): it is called at the opener, and returns what builds the start comment, the element with its rendered children and the citation, which it reads from the opener's line, and the end comment. b-ber-markdown-renderer's directive rule builds it where the block closes: at its exit, at an outer block's exit that crossed it, or at the end of its container (TASK-175). The `citation` attribute is stripped from the opener's attribute string.

## Key Files

| File                      | Purpose                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`            | Full implementation — `openAttributes`, `validateOpen`, `render`, exported directive object        |
| `__tests__/index.test.js` | Jest tests                                                                                                     |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All transforms are synchronous
- No module-level state: the open and the close share nothing but the opener's line. The `pullquoteIndices` stack and the `citation` variable it replaced went in TASK-175
- Does not use `createRenderer`; its footer needs the citation from the opener's line
