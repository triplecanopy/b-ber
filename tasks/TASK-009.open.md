# TASK-009: Convert b-ber-shapes-directives to TypeScript

**Status:** not started
**Scope:** shapes-directives
**Priority:** high

## Description

Convert `b-ber-shapes-directives` to TypeScript. This is the first package
in Stage 1 of the TASK-002 migration and the highest-value conversion in the
entire monorepo: it is consumed by 16 packages, and converting it will
immediately delete the hand-maintained ambient stub in `b-ber-validator`.

**Depends on TASK-008 (tsconfig infrastructure) being committed first.**

## Branch

`feat/ts-stage-1` (same branch as TASK-008).

## Subtasks

- [ ] Audit `packages/b-ber-shapes-directives/src/` — document every export
      (Sets, constants, arrays) and their types.
- [ ] Install TypeScript in the package:
  ```bash
  cd packages/b-ber-shapes-directives && npm install --save-dev typescript
  ```
- [ ] Add `tsconfig.json` and `tsconfig.build.json` using the base template
      from TASK-008.
- [ ] Rename `src/index.js` → `src/index.ts`. Add explicit type annotations:
  - `Set<string>` for all `Set` exports
  - `string[]` for string array exports
  - `const` assertions (`as const`) for object literals
- [ ] Add `build` script to `package.json`:
  ```json
  "build": "tsc -p tsconfig.build.json"
  ```
- [ ] Update `"main"` in `package.json` from the Babel-compiled file to
      `"dist/index.js"`, and add `"types": "dist/index.d.ts"`.
- [ ] Run `tsc` and fix all type errors.
- [ ] Run the build: `npm run build` — verify `dist/index.js` and
      `dist/index.d.ts` are emitted correctly.
- [ ] Verify all 16 consumers still resolve the package:
      Run `npm test` from the monorepo root — all 65 suites must pass.
- [ ] Delete `packages/b-ber-validator/src/typings/b-ber-shapes-directives/`
      — this hand-written ambient stub is now superseded.
- [ ] Run `npm test` again after the deletion to confirm the validator tests
      still pass (they should now use the real `.d.ts`).
- [ ] Commit: `chore(shapes-directives): convert to TypeScript`

## Notes

- The published `index.js` at the package root is a Babel-compiled artifact
  from a prior build step. After this task, `dist/index.js` (from `tsc`)
  replaces it. The `main` field in `package.json` must be updated so consumers
  resolve the right file. Test this carefully — all 16 consumers import via
  `@canopycanopycanopy/b-ber-shapes-directives`, which resolves through
  the symlink to the `main` field.
- If any consumer breaks because it imports a deep path
  (e.g., `.../b-ber-shapes-directives/src/...`), update that import to use
  the package's public export.
- Do not add runtime logic in this task — this is a pure type-annotation pass.
- See TASK-003 for the type-consolidation rationale behind this choice.
