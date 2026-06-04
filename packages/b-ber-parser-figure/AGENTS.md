# AGENTS.md — b-ber-parser-figure

## What This Is

A markdown-it block-container plugin that parses b-ber `figure` directives. It tokenises colon-fenced (`:::`) blocks and looks ahead on the immediately following line for an optional `::` … `::` caption delimiter. When found, the caption body is sliced from the source and attached to the open token's `children` for use by the `render` callback. When absent, the cursor is rewound and the figure is treated as caption-free.

## Key Files

| File                      | Purpose                                                               |
| ------------------------- | --------------------------------------------------------------------- |
| `src/index.ts`            | Plugin entry point; block rule with caption lookahead, token emission |
| `__tests__/index.test.js` | Test file (placeholder only — contains `test.todo`)                   |

## Dev Commands

```
npm test   # runs jest (suite has only todo placeholders — no assertions yet)
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- The plugin uses a custom lookahead rather than standard nested tokenisation; caption state is stored on the token's `children` field (not the markdown-it child token array)
- `validate` and `render` callbacks are injected by the calling directive handler
- No class components; plugin is a plain function export

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the
root AGENTS.md. No tasks are currently open. To add a task, create
tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
