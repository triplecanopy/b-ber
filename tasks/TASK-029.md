# TASK-029: TypeScript Stage 3 — b-ber-tasks and b-ber-cli

**Status:** complete
**Feature:** Migrate JS→TS
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #484 — https://github.com/triplecanopy/b-ber/issues/484

## Description

Stage 3 of the TypeScript migration (defined in TASK-002). Converts the two
pipeline entry-point packages after Stage 2 (grammar/parser/templates/
markdown-renderer types) is complete. These packages sit at the top of the
dependency graph and import from nearly every other package in the monorepo,
so they go last in the Node-only migration.

**Sub-tasks:**

- TASK-030: `b-ber-tasks` — 36 source files, 3769 LOC; all build pipeline
  task handlers (epub, pdf, web, sass, copy, opf, etc.)
- TASK-031: `b-ber-cli` — 14 source files; command definitions, arg parsing,
  entry point

`b-ber-cli` depends on `b-ber-tasks`, so tasks must be converted first.

All work lands on branch `feat/ts-stage-3`. Merge into `feat/upgrades` when
both sub-tasks are complete and `npm test` passes from root.

## Subtasks

- [x] TASK-030: Convert `b-ber-tasks`
- [x] TASK-031: Convert `b-ber-cli`

## Notes

Branch: `feat/ts-stage-3`

After Stage 3 completes, the only remaining JS packages in the Node-only
layer will be `b-ber-reader` (intentionally left as JS — thin deployment
shell with no active work) and `b-ber-reader-react` (Stage 4, deferred until
after TASK-006 Vite migration).

Related: [[TASK-002]] (migration strategy), [[TASK-024]] (Stage 2 parent),
[[TASK-032]] (Stage 4: reader-react).
