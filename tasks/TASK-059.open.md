# TASK-059: Bump build targets for Node packages and browser bundles

**Status:** not started
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

- [ ] Update `tsconfig.base.json`: raise `"target"` and `"lib"` from `"es2020"`
      to `"es2022"` (or `"es2023"` — confirm which Node 24 native features are
      useful)
- [ ] Update root `package.json` `"engines"`: change `"node": ">= 10.x"` to
      `">= 22.x"` (Node 22 is the current LTS; Node 24 is in active development)
- [ ] Add `build.target` to `packages/b-ber-reader-react/vite.config.lib.js`:
      target evergreen browsers (e.g. `['es2022', 'chrome100', 'firefox100',
      'safari15']` or `'es2022'`)
- [ ] Add `build.target` to `packages/b-ber-reader/vite.config.js` with the same
      value
- [ ] Run `npm run build` and confirm both reader-react and reader build cleanly
- [ ] Measure bundle size delta for reader-react `dist/index.js` and record below
- [ ] Run `npm test` — confirm no regressions

## Notes

Baseline bundle size (before this task):
- `packages/b-ber-reader-react/dist/index.js`: 530K
- `packages/b-ber-reader/dist/assets/index-*.js`: 680K

Note: the syntax target bump is a correctness/maintainability improvement more
than a size win. Significant size savings (if any) depend on TASK-058 removing
unused polyfills first. Consider doing TASK-058 before this task so the baseline
is clean.
