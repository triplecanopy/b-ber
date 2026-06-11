# TASK-010: Convert b-ber-shapes-dublin-core and b-ber-shapes-sequences to TypeScript

**Status:** complete
**Feature:** Migrate JS→TS
**Scope:** shapes-dublin-core, shapes-sequences
**Priority:** medium
**GitHub Issue:** #495 — https://github.com/triplecanopy/b-ber/issues/495

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

- [x] Install TypeScript in the package.
- [x] Add `tsconfig.json` and `tsconfig.build.json` using the base template.
- [x] Rename `src/` files to `.ts`. Add type annotations:
  - `elements.js` and `terms.js` export arrays of strings → `string[]`
  - `index.js` re-exports → straightforward re-export in `.ts`
- [x] Add `build` script; update `"main"` and `"types"` in `package.json`.
- [x] Run build, verify `dist/` output.
- [x] Run `npm test` from monorepo root — all suites pass.
- [x] Commit: `feat(shapes-dublin-core,shapes-sequences): convert to TypeScript`

### b-ber-shapes-sequences

- [x] Install TypeScript in the package.
- [x] Add `tsconfig.json` and `tsconfig.build.json`.
- [x] Rename `src/` files to `.ts`. Add type annotations:
  - `sequences/index.ts`: `build: string[]`, `sequences: Record<string, string[]>`
  - `create-build-sequence.ts`: `(desiredSequences: string[]): string[]`
  - `index.ts` re-exports
- [x] Add `build` script; update `"main"` and `"types"` in `package.json`.
- [x] Run build, verify `dist/` output.
- [x] Run `npm test` from monorepo root — all suites pass.
- [x] Commit: (included in same commit as dublin-core above)

## Notes

- Both packages follow the exact pattern from TASK-009 (tsdown, fixedExtension:
  false, tsconfig.build.json excludes tests).
- Removed unused deps from both packages: `@babel/runtime-corejs3`, `lodash`,
  `tar` (runtime), and all Babel devDeps. These were never used by the source.
- Root Babel-compiled artifacts (elements.js, terms.js, index.js, sequences/,
  create-build-sequence.js) deleted; .gitignore updated to `/dist`.
- Root `jest.config.js` collectCoverageFrom stale exclusion paths for these
  packages removed (covered by the existing `!**/dist/**` rule).
- Committed as `67ce3ac0` alongside root tsconfig.json references and
  jest.config.js cleanup. Run in parallel session with TASK-011.
- See TASK-009 notes for the tsdown / dist path pattern.
