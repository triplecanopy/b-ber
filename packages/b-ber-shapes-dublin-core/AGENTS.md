# AGENTS.md — b-ber-shapes-dublin-core

## What This Is

A pure data package exporting two arrays of Dublin Core metadata identifiers. `elements` lists the 14 original DCMI elements (contributor, coverage, creator, description, format, identifier, language, publisher, relation, rights, source, subject, title, type). `terms` lists the full DCMI Metadata Terms vocabulary (~55 entries). These arrays are consumed by the b-ber build pipeline when generating EPUB OPF metadata and validating publication metadata in a project's configuration.

## Key Files

| File                      | Purpose                            |
| ------------------------- | ---------------------------------- |
| `src/index.ts`            | Re-exports `terms` and `elements`  |
| `src/elements.ts`         | Array of 14 DCMI elements          |
| `src/terms.ts`            | Array of ~55 DCMI Metadata Terms   |
| `__tests__/index.test.js` | Tests that both exports are arrays |

## Dev Commands

```
npm test   # runs jest; tests verify both exports are arrays
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- This package is data-only — no runtime logic, no side effects
- Keep `elements` and `terms` in separate files; do not merge them
- Array entries must match the official DCMI specification identifiers exactly (camelCase for terms, lowercase for elements)

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the
root AGENTS.md. No tasks are currently open. To add a task, create
tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
