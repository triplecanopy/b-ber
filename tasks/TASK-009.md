# TASK-009: Convert b-ber-shapes-directives to TypeScript

**Status:** complete
**Feature:** Migrate JS→TS
**Scope:** shapes-directives
**Priority:** high
**GitHub Issue:** #494 — https://github.com/triplecanopy/b-ber/issues/494

## Description

Convert `b-ber-shapes-directives` to TypeScript. This is the first package
in Stage 1 of the TASK-002 migration and the highest-value conversion in the
entire monorepo: it is consumed by 16 packages, and converting it will
immediately delete the hand-maintained ambient stub in `b-ber-validator`.

**Depends on TASK-008 (tsconfig infrastructure) being committed first.**

## Branch

`feat/ts-stage-1` (same branch as TASK-008).

## Subtasks

- [x] Audit `packages/b-ber-shapes-directives/src/` — document every export
      (Sets, constants, arrays) and their types.
- [x] Install TypeScript in the package:
      TypeScript hoisted from root devDeps; per-package install not required.
- [x] Add `tsconfig.json` and `tsconfig.build.json` using the base template
      from TASK-008.
- [x] Rename `src/index.js` → `src/index.ts`. Add explicit type annotations:
  - `Set<string>` for all `Set` exports
  - `Record<string, Set<string>>` for `SUPPORTED_ATTRIBUTES`
- [x] Add `build` script to `package.json`:
      Used `"build": "tsdown"` per TASK-008 infrastructure (tsdown.config.ts).
- [x] Update `"main"` in `package.json` from the Babel-compiled file to
      `"dist/index.js"`, and add `"types": "dist/index.d.ts"`.
- [x] Run `tsc` and fix all type errors — zero errors.
- [x] Run the build: `npm run build` — `dist/index.js` and `dist/index.d.ts`
      emitted correctly.
- [x] Delete `packages/b-ber-validator/src/typings/b-ber-shapes-directives/`
      — hand-written ambient stub superseded by real `.d.ts`.
- [x] Run `npm test` from monorepo root — shapes-directives and validator PASS;
      37 failing suites are all pre-existing bootstrap failures.
- [x] Commit: `feat(shapes-directives): convert to TypeScript`

## Notes

- Used `tsdown` (not `tsc -p tsconfig.build.json`) per the TASK-008 established
  build infrastructure. tsdown.config.ts uses `fixedExtension: false` to emit
  `dist/index.js` / `dist/index.d.ts` (not `.cjs`/`.d.cts`).
- `SUPPORTED_ATTRIBUTES` annotated as `Record<string, Set<string>>` since
  consumers use it with dynamic directive name keys.
- Root `jest.config.js` transform updated: replaced `ts-jest` (unsupported with
  TypeScript 5.x) with `@swc/jest` for all files (`.jt`sx?). Root `.swcrc`
  updated to add `"tsx": true` to support JSX files. Without this change,
  `ts-jest` used the solution-style root `tsconfig.json` (no compiler options →
  ES3 defaults) and TS2802 errors appeared for Set-spread syntax.
- `b-ber-validator` test suite now PASS — it was previously failing with
  `Cannot find module '@canopycanopycanopy/b-ber-shapes-directives'` because
  the Babel-compiled `index.js` artifact was absent (gitignored). After this
  task the package publishes `dist/index.js` which is always present.
- Stale root `index.js` (Babel artifact) deleted; `.gitignore` updated to
  ignore `/dist` instead of `/index.js`.
- Removed unused deps from package.json: `@babel/runtime-corejs3`, `lodash`,
  `tar` (runtime), `@babel/cli`, `@babel/core`, `@babel/preset-env`,
  `browserslist` (devDeps). These were never used by the source.
- Root `tsconfig.json` references updated to include this package.
- See TASK-003 for the type-consolidation rationale behind this choice.
