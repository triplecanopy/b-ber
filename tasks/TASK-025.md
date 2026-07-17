# TASK-025: Convert b-ber-grammar-\* packages to TypeScript

**Status:** complete
**Feature:** Migrate JS→TS
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #500 — https://github.com/triplecanopy/b-ber/issues/500

## Description

Convert all 16 `b-ber-grammar-*` packages from JavaScript to TypeScript.
Each package is a markdown-it plugin that transforms a single b-ber directive
type into HTML.

**Packages (16):** all converted

## Subtasks

- [x] Convert `b-ber-grammar-attributes` first; verify tests pass
- [x] Convert `b-ber-grammar-renderer`; verify tests pass
- [x] Convert remaining 14 packages (done in parallel)
- [x] Add tsdown build + update `package.json` `main`/`types` fields for each
- [x] Fix b-ber-lib subpath imports → named imports from main package
- [x] Switch jest transform to @swc/jest + update moduleNameMapper
- [x] Add tsdown.config.ts, tsconfig.json, tsconfig.build.json to all
- [x] Update .eslintrc.js with node resolver for .ts extension
- [x] Update 4 test files that split b-ber-lib mocks (audio-video, frontmatter, image, vimeo)
- [x] All 16 packages pass their test suites
- [x] Update TASK-024 subtask checklist

## Notes

Branch: `feat/ts-stage-2`
Commit: `17ee7b98`

Key decisions:

- Used `sed` to bulk-fix b-ber-lib subpath imports across all packages
- `b-ber-lib/utils` functions (getImageOrientation, createUnsupportedInline):
  import `{ utils }` from main package then `const { fn } = utils` after imports
- 4 test files had split mocks (`@canopycanopycanopy/b-ber-lib/State` + main):
  fixed by adding `jest.requireMock('@canopycanopycanopy/b-ber-lib/State')` as
  `State` property in the main mock; frontmatter test updated to use named import
- Source files were renamed .js → .ts without strict type annotations;
  @swc/jest handles transpilation without type checking for tests

Parent: [[TASK-024]]
