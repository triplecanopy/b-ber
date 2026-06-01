# TASK-023: Research Lerna replacement / upgrade options

**Status:** not started
**Scope:** monorepo
**Priority:** low

## Description

Lerna v6 is currently used for monorepo orchestration (bootstrapping, running
scripts across packages, publishing). Evaluate whether Lerna should be upgraded
to v8, replaced with a modern alternative (npm workspaces, pnpm workspaces,
Nx, Turborepo), or kept as-is.

This is a research task — no implementation. Output is a recommendation with
tradeoffs documented in the Notes section and a decision recorded here for
future reference.

## Questions to answer

1. **What does Lerna v6 → v8 buy us?** What changed in v7/v8 (NX integration
   mandatory vs optional, task graph, caching)? Any breaking changes that
   would affect the current bootstrap/hoist workflow?

2. **npm workspaces as a drop-in?** Since npm v7+, `workspaces` in root
   `package.json` handles symlinks and hoisting natively. What would migration
   from `lerna bootstrap --hoist` look like? What does Lerna still provide
   that npm workspaces doesn't (publishing, `lerna run` ordering)?

3. **pnpm workspaces?** pnpm's strict node_modules layout and workspace
   protocol are more explicit than npm hoisting. Would the hoisted-dep approach
   in this repo map cleanly to pnpm, or would packages need per-package dep
   declarations fixed first?

4. **Turborepo / Nx?** These add task caching and parallelism. At b-ber's
   current scale (~30 packages, mostly small), is the added complexity worth
   it? What's the migration cost?

5. **Publishing workflow impact.** `lerna publish` handles versioning and
   npm publish for all packages. What replaces this if Lerna is dropped?
   (changesets? manual?)

## Subtasks

- [ ] Survey Lerna v6 → v8 changelog and migration guide
- [ ] Evaluate npm workspaces as minimal replacement for `lerna bootstrap`
- [ ] Evaluate pnpm workspaces as an option (stricter, faster installs)
- [ ] Assess Turborepo/Nx fit at this repo's scale
- [ ] Document recommendation + rationale in Notes below

## Notes

_Fill in during research._

Relevant context:

- Current setup: `lerna@^6.5.1`, `lerna bootstrap --hoist` to link packages,
  `lerna run <script>` to fan out scripts, `lerna publish` for releases.
- The `--hoist` flag puts all package deps at the root `node_modules` — the
  current test suite depends on this. Any replacement must preserve hoisting
  or require per-package dep installations to be explicit.
- This repo does NOT currently use NX features (caching, dependency graph).
  Lerna v7+ made NX integration opt-in; Lerna v8 may have changed this again.
- See TASK-008 notes: `typescript@^5.9.3` was installed with `--legacy-peer-deps`
  to work around `ts-jest@26` + `@typescript-eslint@4` peer dep constraints.
  Whichever tooling is chosen must handle these legacy peer deps gracefully
  during the TS migration window.
- Related: [[TASK-021]] (audit `--no-package-lock` bootstrap flag).
