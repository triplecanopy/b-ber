# AGENTS.md — b-ber-grammar-pullquote

## What This Is

Transforms `pullquote` and `blockquote` block directives (and their `exit` close markers) into `<section>` or `<blockquote>` elements with optional `<footer><cite>` citation blocks. Does not use `createRenderer` because it needs to emit closing content (the citation) from the opening directive's attributes at exit time. Tracks open directive ids in a module-level `pullquoteIndices` stack. The `citation` attribute is stripped from the attribute string and stored separately for use when the exit directive is encountered.

## Key Files

| File                      | Purpose                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `src/index.js`            | Full implementation — `handleOpen`, `handleClose`, `cite`, `validateOpen`, `render`, exported directive object |
| `__tests__/index.test.js` | Jest tests                                                                                                     |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All transforms are synchronous
- `pullquoteIndices` is module-level state; this is intentional but means the module is not re-entrant — do not introduce concurrent rendering
- Does not use `createRenderer`; validates open/close itself to support the citation-at-close pattern

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the root AGENTS.md. No tasks are currently open. To add a task, create tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
