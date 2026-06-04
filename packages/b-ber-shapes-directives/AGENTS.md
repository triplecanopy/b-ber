# AGENTS.md — b-ber-shapes-directives

## What This Is

A pure data package exporting constants and `Set` collections that define every b-ber directive and its allowed attributes. Exports include marker strings and minimum lengths (`BLOCK_DIRECTIVE_MARKER`, `BLOCK_DIRECTIVE_FENCE`, etc.), directive sets grouped by publication position (`FRONTMATTER_DIRECTIVES`, `BODYMATTER_DIRECTIVES`, `BACKMATTER_DIRECTIVES`, `INLINE_DIRECTIVES`, `MISC_DIRECTIVES`, `DRAFT_DIRECTIVES`, `DEPRECATED_DIRECTIVES`), merged convenience sets, per-directive allowed-attribute sets (`SUPPORTED_ATTRIBUTES`), and HTML attribute sets for audio/video/iframe/Vimeo elements.

## Key Files

| File                      | Purpose                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| `src/index.ts`            | All exports — marker constants, directive Sets, `SUPPORTED_ATTRIBUTES`, HTML attribute sets |
| `__tests__/index.test.js` | Tests for marker constants, Set types, and merged set correctness                           |

## Dev Commands

```
npm test   # runs jest; tests verify constants and Set shapes
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- This package is data-only — no runtime logic, no side effects
- All directive and attribute additions must be reflected here before being used in parser or renderer packages
- Use `Set` for all collections; do not switch to arrays or objects

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the
root AGENTS.md. No tasks are currently open. To add a task, create
tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
