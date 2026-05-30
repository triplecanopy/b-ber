# TASK-003: Research type consolidation strategy across the monorepo

**Status:** not started
**Scope:** monorepo
**Priority:** medium

## Description

As the monorepo moves toward TypeScript (TASK-002), shared types and interfaces
that currently exist as JSDoc comments, implicit shapes, or duplicated objects
across packages will need a home. This task researches where types currently
live, identifies what is shared or duplicated, and produces a recommendation
for how to organize types going forward.

## Subtasks

- [ ] Audit existing type-adjacent code across all packages:
  - `b-ber-shapes-*` packages: document what each exports and whether the
    exports are consumed by other packages.
  - JSDoc `@typedef` and `@param` annotations across `b-ber-lib`,
    `b-ber-tasks`, parsers, and grammars.
  - Any TypeScript or Flow type files that already exist (`.d.ts`, `.ts`).
  - Prop types in `b-ber-reader-react` (PropTypes vs. TypeScript interfaces).
- [ ] Identify types that are duplicated or closely mirrored across packages.
- [ ] Evaluate placement options:

  **Option A: Dedicated `b-ber-types` package**

  - Pros: single source of truth; can be versioned independently; clear
    import path (`@tristandunn/b-ber-types` or similar).
  - Cons: adds a package to maintain; adds a dev dependency to every consumer;
    type-only packages have quirks with `isolatedModules` and bundlers.
  - Viable if types will eventually be published or consumed by external tools.

  **Option B: Types co-located with their owning package**

  - Pros: types live next to the code they describe; no extra package overhead.
  - Cons: shared types must be imported across package boundaries, which adds
    coupling; shared types end up in whichever package "happens" to own them.
  - Best when most types are package-local with minimal sharing.

  **Option C: Shared `types/` directory at the monorepo root (not a package)**

  - Pros: zero package overhead; easy to find; works well with `paths` in a
    root `tsconfig.json`.
  - Cons: not a publishable artifact; requires `paths` configuration in every
    consumer tsconfig; can become a dumping ground.
  - Best when types are monorepo-internal only and will never be published.

  **Option D: Expand `b-ber-shapes-*` into typed packages**

  - The shapes packages already exist and have the right conceptual scope.
  - Could be converted to TypeScript first and re-exported as types.
  - Pros: no new packages; leverages existing semantics.
  - Cons: shapes packages are currently runtime code (not type-only).

- [ ] Decide whether types need to be published as part of the npm packages:
  - If external consumers (e.g. b-ber plugin authors) need types, a published
    `b-ber-types` package or per-package `.d.ts` exports are required.
  - If types are purely internal to the monorepo build, Options B, C, or D
    are simpler.
- [ ] Write a recommendation with rationale.
- [ ] Open implementation tasks once the strategy is chosen.

## Notes

- This task should run in parallel with TASK-002 (JS→TS migration strategy).
  The two tasks inform each other: the TS migration plan needs to know where
  shared types will live, and the type-consolidation strategy needs to know
  how aggressively TypeScript will be adopted.
- The `b-ber-shapes-*` packages already encode some data-shape information.
  Converting them to TypeScript first (as recommended in TASK-002) and
  re-exporting their types may be the path of least resistance (Option D).
- If the monorepo never publishes types externally, a root `types/` directory
  (Option C) is the lowest-overhead starting point and can be replaced by a
  dedicated package later if needed.
- Do not create any new packages or move any files in this task.
