# TASK-006: Migrate b-ber-reader-react from webpack to Vite

**Status:** complete
**Feature:** Upgrade tooling
**Scope:** reader-react
**Priority:** medium
**GitHub Issue:** #472 — https://github.com/triplecanopy/b-ber/issues/472

## Description

Replace webpack 5 with Vite in `b-ber-reader-react`. Combine with the CSS
Modules migration (reader-react TASK-017) in the same pass to avoid auditing
the SCSS tree twice. See TASK-001 research findings for the full rationale
(Vite chosen over Rsbuild).

## Branch

Work on `feat/vite-migration`. Do not merge to `feat/upgrades` until all
subtasks are complete and `npm test` passes. Keep each commit focused:
vite config → plugin wiring → polyfills → CSS Modules → cleanup.

## Subtasks

- [x] Create the branch: `git checkout -b feat/vite-migration`
- [x] Install dependencies:
  ```
  npm install --save-dev vite @vitejs/plugin-react sass
  ```
  Uninstalled: `webpack webpack-cli webpack-dev-server babel-loader css-loader sass-loader postcss-loader url-loader style-loader mini-css-extract-plugin html-webpack-plugin webpack-remove-empty-scripts webpack-cleanup-plugin file-loader webpack-bundle-analyzer`
- [x] Write `vite.config.js` (dev server):
  - `@vitejs/plugin-react` replaces the inline Babel config in `webpack/loaders.js`
  - `resolve.alias` covers `stream`, `buffer`, `os` (replaces `vite-plugin-node-polyfills`
    which caused rolldown conflicts in lib mode)
  - Dev server on port 3000, `dev/index.html` as entry via `root: 'dev'`
  - `react({ include: /\.(jsx?|tsx?)$/ })` to handle JSX in `.js` files
- [x] Write `vite.config.lib.js` (production UMD build):
  - `build.lib`: entry `src/index.jsx`, name `BberReader`, formats `['umd']`
  - `build.rollupOptions.external`: React, ReactDOM (replaces webpack `externals`)
  - `assetFileNames` preserves `styles.css` output name for backward compat with b-ber-reader
- [x] Add `dev/index.html` (Vite entry replacing `dev/index.ejs`)
- [x] Update `package.json` scripts:
  - `"start": "vite --config vite.config.js"`
  - `"build": "vite build --config vite.config.lib.js"`
  - Removed all webpack shell script references
- [x] Fix SCSS font paths:
  - `src/styles/_fonts.scss`: changed `url('fonts/...')` → `url('../fonts/...')`
    (correct relative path from `src/styles/` to `src/fonts/`)
  - `src/styles/_icons.scss`: removed webpack `~` prefix; material-icons imported
    via JS (`import 'material-icons/iconfont/filled.css'` in `src/index.jsx`)
- [x] Rename `src/lib/with-navigation-actions.js` → `.jsx` (file contained JSX;
      Vite 8/rolldown requires `.jsx` extension for JSX syntax)
- [x] Delete `webpack/` directory
- [x] Delete webpack-specific scripts (`scripts/analyze.sh`, `build.sh`, `start.sh`,
      `watch.sh`, `webpack.sh`)
- [x] Run `npm test` — all 18 suites pass (60 tests, 1 skipped, 3 todo)
- [x] Verify production build: `npm run build` — emits `dist/index.js` (540 kB)
      and `dist/styles.css` (698 kB with inlined fonts)
- [x] Verify dev server: `npm start`, confirm HMR works in browser
- [x] CSS Modules migration decoupled — TASK-017 is standalone; not a TASK-006 gate
- [x] Update `PLAN.md` in reader-react
- [x] Update root `PLAN.md`

## Notes

- **Node polyfills**: `vite-plugin-node-polyfills` was attempted but caused rolldown
  resolution errors in lib mode (it injects process shims into react/jsx-runtime).
  Replaced with `resolve.alias` mapping `stream → stream-browserify`, `buffer → buffer/`,
  `os → os-browserify/browser`. Same effect, no side effects.
- **Font inlining**: Vite 8 (rolldown) inlines font assets in the CSS output regardless
  of file size. The old webpack output had separate `dist/fonts/*.ttf` files; the new
  Vite output has all fonts inlined as base64 in `dist/styles.css` (698 kB uncompressed,
  424 kB gzipped). This is more portable for library consumers (no separate font hosting),
  but a larger initial download. Can be revisited if CSS file size becomes a concern.
- **CSS filename preserved**: `assetFileNames` in `vite.config.lib.js` names the CSS
  output `styles.css` (not `b-ber-reader-react.css`) for backward compat with
  `b-ber-reader/src/index.js` which imports `@canopycanopycanopy/b-ber-reader-react/dist/styles.css`.
- **CSS Modules (TASK-017)**: Decoupled from TASK-006. The current SCSS structure
  (global partials in `src/styles/`) works correctly with Vite without any changes.
  CSS Modules would require significant component refactoring and is tracked separately
  as TASK-017 (low priority).
- **SCSS deprecation warnings**: Global built-in function warnings (`length`, `nth`,
  `append`, `map-get`) in `_mixins.scss` were fixed by adding `@use 'sass:list'` and
  `@use 'sass:map'` and namespacing the calls. Remaining `@import` deprecation warnings
  are a broader migration to the `@use`/`@forward` module system — out of scope here,
  tracked as part of TASK-017.
- **`with-navigation-actions.js` renamed to `.jsx`**: Vite 8/rolldown requires the
  `.jsx` extension to parse JSX syntax; `.js` files are parsed as plain JS. One other
  file (`src/lib/process-nodes.js`) was flagged initially but uses `React.createElement`,
  not JSX syntax, so no rename needed.
- `css-loader` was at version 0.28.10 — ancient. Vite's built-in CSS handling
  replaces it entirely.
- `localIdentName` for CSS Modules in test: if CSS Modules are added later,
  configure `css.modules.generateScopedName: '[local]'` in a test vite config
  so class names are predictable.
- The custom config override pattern (`--config` CLI arg for themed builds)
  maps directly to `vite --config`. The lodash `setWith` deep-clone in
  `config.custom-example.js` can be replaced with Vite's `mergeConfig`.
- `b-ber-reader`'s webpack migration (TASK-007) depends on this task being
  complete first — `b-ber-reader` imports the compiled reader-react output.
- Jest still uses `babel-jest` for the test transform (the `jest-transform-upward.js`
  shim) — Vite does not affect the test pipeline. No jest config changes needed.
