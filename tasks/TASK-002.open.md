# TASK-002: Plan JS → TS migration strategy

**Status:** not started
**Scope:** monorepo
**Priority:** medium

## Description

The monorepo is currently pure JavaScript. Migrating to TypeScript will
improve type safety, enable better IDE tooling, and reduce categories of
runtime errors — especially important before any large-scale refactoring.
This task produces a migration strategy document before any code is touched.

The strategy must account for the planned webpack replacement (TASK-001).
Migrating the build system and the language at the same time is high-risk;
the sequencing decision is the most important output of this task.

## Subtasks

- [ ] Audit current build tooling in each package to understand how TypeScript
      would interact with it:
  - Which packages use webpack (and therefore need webpack's TS loader or
    `ts-loader` / `babel-preset-typescript`)?
  - Which packages are Node-only (CLI, tasks, lib, parsers, grammars) and
    can be compiled with `tsc` directly?
  - Which packages are browser bundles (reader-react)?
- [ ] Decide sequencing relative to TASK-001 (webpack replacement):
  - Option A: Migrate webpack → new bundler first, then add TypeScript.
    Lower risk per change; the new bundler likely has first-class TS support
    (Vite, Rsbuild) so TS config is simpler once it's in place.
  - Option B: Add TypeScript to the existing webpack config first.
    `babel-preset-typescript` strips types at build time with zero config
    change; gives TS benefits earlier but leaves webpack debt in place longer.
  - Option C: Do both in one pass, package by package.
    Higher per-package risk but fewer total migration passes.
  - Recommendation must be written down with reasoning.
- [ ] Define migration stages and order:
  - Suggested stage order: types/shapes packages first (smallest, no deps
    within monorepo), then lib/logger, then parsers/grammars, then tasks/cli,
    then reader-react last (most complex, most tooling surface area).
  - Confirm or revise this order based on dependency graph.
- [ ] Identify shared TypeScript config requirements:
  - Root `tsconfig.base.json` with strict settings shared across all packages.
  - Per-package `tsconfig.json` extending the base.
  - `paths` / `references` for monorepo cross-package imports.
- [ ] Determine type-checking strategy during incremental migration:
  - `checkJs: true` + JSDoc as a bridge before each package is converted?
  - `allowJs: true` in transitional tsconfigs to allow mixed packages?
  - `noImplicitAny` enforcement timeline.
- [ ] Decide on `strict` mode rollout (all-at-once vs. per-package over time).
- [ ] Write a one-page migration plan summarizing the above decisions.
- [ ] Open per-package implementation tasks once the plan is approved.

## Notes

- This is a planning task only. No source files should be changed.
- If TASK-001 concludes that Vite or Rsbuild is the right bundler, TypeScript
  support in those tools is first-class and essentially free — that favors
  Option A (bundler first).
- If TASK-001 is blocked or deprioritized, Option B (babel-preset-typescript)
  is a viable interim path that avoids coupling the two migrations.
- The shapes packages (`b-ber-shapes-directives`, `b-ber-shapes-dublin-core`,
  `b-ber-shapes-sequences`) are the best candidates to convert first: they are
  pure data definitions, have no build complexity, and converting them first
  exposes the monorepo cross-package import pattern early.
- See TASK-003 for the related type-consolidation work; that research should
  run in parallel with this task since a dedicated types location will affect
  how the TS migration is structured.
