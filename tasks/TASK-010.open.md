# TASK-010: Convert b-ber-shapes-dublin-core and b-ber-shapes-sequences to TypeScript

**Status:** not started
**Scope:** shapes-dublin-core, shapes-sequences
**Priority:** medium

## Description

Complete the shapes package TypeScript migration by converting the two
remaining shapes packages. These are smaller and simpler than
`b-ber-shapes-directives` (converted in TASK-009) and have fewer consumers.
Grouped into one task because both follow the identical pattern and can be
committed in the same session.

**Depends on TASK-009 being committed first** (establishes the pattern).

## Branch

`feat/ts-stage-1` (same branch as TASK-008, TASK-009).

## Subtasks

### b-ber-shapes-dublin-core

- [ ] Install TypeScript in the package.
- [ ] Add `tsconfig.json` and `tsconfig.build.json` using the base template.
- [ ] Rename `src/` files to `.ts`. Add type annotations:
  - `elements.js` and `terms.js` export arrays of strings → `string[]`
  - `index.js` re-exports → straightforward re-export in `.ts`
- [ ] Add `build` script; update `"main"` and `"types"` in `package.json`.
- [ ] Run build, verify `dist/` output.
- [ ] Run `npm test` from monorepo root — all suites pass.
- [ ] Commit: `chore(shapes-dublin-core): convert to TypeScript`

### b-ber-shapes-sequences

- [ ] Install TypeScript in the package.
- [ ] Add `tsconfig.json` and `tsconfig.build.json`.
- [ ] Rename `src/` files to `.ts`. Add type annotations:
  - Sequence arrays → explicit type for each task entry (string or object)
  - `createBuildSequence` helper → typed signature
  - `sequences/index.js` re-exports
- [ ] Add `build` script; update `"main"` and `"types"` in `package.json`.
- [ ] Run build, verify `dist/` output.
- [ ] Run `npm test` from monorepo root — all suites pass.
- [ ] Commit: `chore(shapes-sequences): convert to TypeScript`

## Notes

- `b-ber-shapes-dublin-core` is consumed only by `b-ber-lib` — easiest
  migration in the repo.
- `b-ber-shapes-sequences` is consumed by `b-ber-lib`, `b-ber-cli`, and
  `b-ber-tasks`. Verify all three resolve correctly after the `main` field update.
- The `sequences/` subdirectory has its own `index.js` that re-exports from
  several format-specific files. Convert all files in the subdirectory, not
  just the top-level `index.js`.
- See TASK-009 notes for the `main` field / dist/ path pattern.
