# TASK-024: TypeScript Stage 2 — grammar, parser, templates, markdown-renderer

**Status:** complete
**Feature:** Migrate JS→TS
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #499 — https://github.com/triplecanopy/b-ber/issues/499

## Description

Stage 2 of the TypeScript migration (defined in TASK-002). Converts the
mid-layer packages after the Stage 1 foundation (shapes, logger, lib) is in
place. All five Stage 1 packages are now fully typed and publishing `.d.ts`
declarations, so types flow into Stage 2 consumers automatically.

Stage 2 is split into two internal waves based on dependency order:

**Wave A — grammar, parser, and templates** (can largely run in parallel):

- TASK-025: `b-ber-grammar-*` (16 packages)
- TASK-026: `b-ber-parser-*` (5 packages)
- TASK-027: `b-ber-templates`

**Wave B — depends on Wave A types being in place**:

- TASK-028: `b-ber-markdown-renderer` (imports all grammar + parser packages;
  also includes a vendored highlight.js replacement)

`b-ber-markdown-renderer` must be last because its `src/index.js` imports
every grammar and parser package. Wave A packages are independent of each
other and can be done on the same branch in any order.

All work lands on branch `feat/ts-stage-2`. Merge into `feat/upgrades` when
all four sub-tasks are complete and `npm test` passes from root.

## Subtasks

- [x] TASK-025: Convert `b-ber-grammar-*` (16 packages)
- [x] TASK-026: Convert `b-ber-parser-*` (5 packages)
- [x] TASK-027: Convert `b-ber-templates`
- [x] TASK-028: Convert `b-ber-markdown-renderer` (includes hljs vendor replacement)

## Notes

Branch: `feat/ts-stage-2`

Shared setup for all Wave A packages:

- Add `@types/markdown-it` as a dev dep to each grammar and parser package
  that imports `markdown-it` types (all 16 grammars, 5 parsers, and
  markdown-renderer).
- `markdown-it@8.4.1` has no bundled types; `@types/markdown-it` on npm
  covers this version.
- tsconfig pattern: extend `../../tsconfig.base.json`, set `outDir: ./dist`,
  `rootDir: ./src` — same pattern used in Stage 1 packages.

Dependency order within Wave A:

1. `b-ber-grammar-attributes` first — imported by 6 grammar packages
2. `b-ber-grammar-renderer` second — imported by most block-directive grammars
3. Remaining 14 grammar packages in any order
4. Parser packages are independent of grammars; can run in parallel

After Stage 2 completes, TASK-029 (Stage 3: tasks + cli) is unblocked.

Related: [[TASK-002]] (migration strategy), [[TASK-029]] (Stage 3 parent).
