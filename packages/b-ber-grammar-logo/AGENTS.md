# AGENTS.md — b-ber-grammar-logo

## What This Is

Transforms the `logo` inline directive into a `<figure class="logo"><img style="width:120px;" .../></figure>`. Requires a `source` attribute; checks that the image file exists and logs a warning if not. The source is resolved relative to `state.src.images()` for the existence check, and rendered as `../images/<source>` in the output HTML. Does not add to `state.figures` (logos are not listed in the LOI).

## Key Files

| File                      | Purpose                                             |
| ------------------------- | --------------------------------------------------- |
| `src/index.js`            | Full implementation — single-file directive handler |
| `__tests__/index.test.js` | Jest tests                                          |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All transforms are synchronous
- The 120px inline width is intentional and hardcoded; do not remove it without updating dependent theme styles

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the root AGENTS.md. No tasks are currently open. To add a task, create tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
