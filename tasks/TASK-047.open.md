# TASK-047: Research watch mode scripts for monorepo development

**Status:** not started
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #515 — https://github.com/triplecanopy/b-ber/issues/515

## Description

Running packages in watch mode during development is a critical part of the
developer experience. The monorepo has a root `watch` script (`lerna run watch --stream`) but most individual packages do not have a `watch` script defined.
This task researches the correct watch mode setup for each package type and
defines a consistent target state to be implemented as part of (or after)
TASK-038 (package.json script cleanup).

This is a research task. The output is a recommendation and concrete target
`watch` script definitions per package type, ready to apply in TASK-038.

## Context

Relates to [[TASK-038]] (package.json script cleanup). TASK-038 defines the
target state for `build`, `typecheck`, and `test` scripts. Watch mode is a
natural extension of that cleanup — dev workflows depend on it for tighter
feedback loops.

Types of packages in the monorepo and their likely watch requirements:

- **TypeScript packages using tsdown** (grammars, parsers, shapes, lib, logger,
  templates, markdown-renderer, cli, tasks): `tsdown --watch` — tsdown supports
  a watch flag natively and rebuilds on source changes.
- **b-ber-reader-react** (webpack/Vite): Already has a `watch` script
  (`./scripts/watch.sh`). After TASK-006 (Vite migration) this will change.
- **b-ber-reader** (legacy webpack): `webpack --watch` or `nodemon`.
- **b-ber-resources** (Babel output): `babel --watch`.
- **b-ber-theme-serif / b-ber-theme-sans** (SCSS only): `sass --watch`.
- **b-ber-validator** (tsc + eslint): `tsc --watch --noEmit` for type checking;
  no compile output watch needed.

The root `lerna run watch --stream` script currently assumes all packages have a
`watch` entry. Packages without one cause Lerna to error or skip silently
depending on version. This needs to be verified.

## Subtasks

- [ ] **Verify root `lerna run watch`**: run `npm run watch` from repo root and
      observe which packages succeed, which error, and which are silently skipped.
      Check Lerna version-specific behaviour (`--ignore-missing-script` flag or
      equivalent).
- [ ] **Inventory current watch scripts**: list all packages that have a `watch`
      entry in `package.json` today; note what command they use.
- [ ] **Confirm tsdown watch mode**: run `tsdown --watch` in at least one TS
      package (e.g. `b-ber-lib`) and confirm it rebuilds correctly on source edits
      and handles TypeScript errors gracefully.
- [ ] **Confirm jest --watch compatibility**: check whether `jest --watch` in a
      per-package context requires any config changes under Jest 29 (relates to
      [[TASK-034]] Jest upgrade).
- [ ] **Design target watch scripts per package type**: write the concrete
      `"watch"` script value for each type, including any flags needed.
- [ ] **Assess whether a root `test:watch` makes sense**: or whether per-package
      `test:watch` (as `jest --watch --testPathPattern`) is a better DX.
- [ ] **Document recommendation** in Notes below; open a follow-on implementation
      task referencing [[TASK-038]] if changes are warranted.

## Notes

Branch: `feat/upgrades` (research only)

**Key constraint:** Watch scripts must degrade gracefully when run from the repo
root via `lerna run watch` — packages that don't need a watch step (e.g. theme
packages with no JS output, validator) should either define a no-op or be
excluded from the root invocation.

**Interaction with TASK-036 (Lerna upgrade):** Lerna v7 removed `--hoist` and
changed how `lerna run` skips missing scripts. The watch behaviour at the root
level may change after TASK-036 lands — coordinate so the watch scripts defined
here are compatible with Lerna v7+.

Related: [[TASK-038]] (script cleanup), [[TASK-034]] (jest upgrade — `jest --watch`),
[[TASK-036]] (Lerna upgrade — `lerna run watch` behaviour)
