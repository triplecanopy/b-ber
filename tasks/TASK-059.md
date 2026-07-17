# TASK-059: Bump build targets for Node packages and browser bundles

**Status:** complete
**Feature:** Node.js modernization
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** (add after creating the issue)

## Description

The current build targets are stale:

- **Node packages (tsdown):** `tsconfig.base.json` sets `"target": "es2020"`. The
  monorepo runs on Node 24 (confirmed), which supports ES2022+ natively. There is
  no reason to emit downcompiled class fields, logical assignment operators, etc.
- **Browser bundles (Vite):** No explicit `build.target` is set in either
  `vite.config.lib.js` (reader-react) or `vite.config.js` (reader). Vite
  defaults to `['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14']` —
  late 2020 browsers. The reader is a self-hosted EPUB viewer, not a public-facing
  site; it is reasonable to target current/evergreen browsers.
- **Root `engines` field:** `package.json` declares `"node": ">= 10.x"` which is
  years out of support. This should be updated to reflect the actual minimum.

## Subtasks

- [x] `tsconfig.base.json`: `"target"` and `"lib"` raised to `"es2022"`
- [x] `packages/b-ber-validator/tsconfig.json`: standalone config bumped from
      `"es6"` to `"es2022"` (not covered by tsconfig.base.json — found during audit)
- [x] Root `package.json` engines: `node >= 10.x` → `>= 22.x`; `npm >= 6.x` → `>= 10.x`
- [x] `vite.config.lib.js`: `build.target: 'es2022'` added
- [x] `vite.config.js` (reader): `build.target: 'es2022'` added
- [x] `npm run build` passes cleanly
- [x] Bundle sizes recorded in Notes
- [x] `npm test` passes (84 suites, 649 tests)

## Notes

Bundle sizes (TASK-058 polyfill removal already applied as baseline):
- reader-react `dist/index.js`: 495K → 495K (no change — confirmed target bump is
  maintenance, not a size win for this codebase)
- reader `dist/assets/index-*.js`: 680K → 645K (the reader savings reflect TASK-058's
  polyfill removal flowing through the reader app bundle, not the target bump itself)

`b-ber-validator/tsconfig.json` is standalone (no `extends`) and had `"target": "es6"` —
bumped to `"es2022"` as part of this task.
