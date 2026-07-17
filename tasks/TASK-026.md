# TASK-026: Convert b-ber-parser-\* packages to TypeScript

**Status:** complete
**Feature:** Migrate JS→TS
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #501 — https://github.com/triplecanopy/b-ber/issues/501

## Description

Convert all 5 `b-ber-parser-*` packages from JavaScript to TypeScript. Parser
packages are markdown-it plugins that handle specific content types; each is
1–2 source files. They are independent of grammar packages and can be converted
in parallel with TASK-025.

**Packages (5):**

- `b-ber-parser-dialogue` (1 file)
- `b-ber-parser-figure` (1 file)
- `b-ber-parser-footnotes` (2 files: index.ts, counter.ts)
- `b-ber-parser-gallery` (1 file)
- `b-ber-parser-section` (1 file)

## Subtasks

- [x] Confirm current state of `b-ber-parser-footnotes/src` (was still `.js`)
- [x] Add tsdown build + update `package.json` `main`/`types` fields for each
- [x] Convert all 5 packages: rename `.js` → `.ts`, add type annotations
- [x] Fix broken subpath imports: `b-ber-lib/State` → `{ State as x } from '@canopycanopycanopy/b-ber-lib'`
- [x] Switch jest transform from babel-jest to @swc/jest; update moduleNameMapper
- [x] Add tsdown.config.ts, tsconfig.json, tsconfig.build.json to all 5 packages
- [x] Update package.json: remove @babel/\* devDeps, add tsdown/typescript/@swc/core/@swc/jest
- [x] Update test mocks for footnotes and gallery (b-ber-lib/State → b-ber-lib named export)
- [x] Add .eslintrc.js with node resolver extensions for .ts to all 5 packages
- [x] Run `npm test` in each package — 61 tests pass across all 5 packages
- [x] Update TASK-024 subtask checklist

## Notes

Branch: `feat/ts-stage-2`
Commit: `2d5974aa`

Key decisions:

- Used `any` types for markdown-it state/md parameters (no @types/markdown-it needed)
- `bberState` and `_state` use `{ State as x }` from b-ber-lib — State is a singleton
  `new State()` instance exported as a named export
- ESLint `import/no-unresolved` requires `.ts` extension resolver setting per-package

Parent: [[TASK-024]]
