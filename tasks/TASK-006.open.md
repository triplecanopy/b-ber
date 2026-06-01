# TASK-006: Migrate b-ber-reader-react from webpack to Vite

**Status:** not started
**Scope:** reader-react
**Priority:** medium
**GitHub Issue:** #472 — https://github.com/triplecanopy/b-ber/issues/472

## Description

Replace webpack 5 with Vite in `b-ber-reader-react`. Combine with the CSS
Modules migration (reader-react TASK-017) in the same pass to avoid auditing
the SCSS tree twice. See TASK-001 research findings for the full rationale
(Vite chosen over Rsbuild).

## Branch

Work on `feat/vite-migration`. Do not merge to `ai-refactor` until all
subtasks are complete and `npm test` passes. Keep each commit focused:
vite config → plugin wiring → polyfills → CSS Modules → cleanup.

## Subtasks

- [ ] Create the branch: `git checkout -b feat/vite-migration`
- [ ] Install dependencies:
  ```
  npm install --save-dev vite @vitejs/plugin-react vite-plugin-node-polyfills sass
  ```
  Uninstall: `webpack webpack-cli webpack-dev-server babel-loader css-loader sass-loader postcss-loader url-loader style-loader mini-css-extract-plugin postcss-preset-env remove-empty-scripts-webpack-plugin`
  (do these in separate commits — install first, uninstall after the new config works)
- [ ] Write `vite.config.js` (dev server + test builds):
  - `@vitejs/plugin-react` replaces the inline Babel config in `webpack/loaders.js`
  - `vite-plugin-node-polyfills` covers `stream`, `buffer`, `os`
  - Dev server on port 3000, `dev/index.html` as entry
  - CSS Modules enabled for `*.module.scss`
- [ ] Write `vite.config.lib.js` (production UMD build):
  - `build.lib`: entry `src/index.jsx`, name `BberReader`, formats `['umd']`
  - `build.rollupOptions.external`: React, ReactDOM (replaces webpack `externals`)
  - CSS extracted to single file automatically
- [ ] Add `dev/index.html`:
  ```html
  <!DOCTYPE html>
  <html>
    <body>
      <div id="app"></div>
      <script type="module" src="./index.js"></script>
    </body>
  </html>
  ```
- [ ] Update `package.json` scripts:
  - `"start": "vite --config vite.config.js"`
  - `"build": "vite build --config vite.config.lib.js"`
  - Remove webpack shell script references
- [ ] CSS Modules migration (TASK-017 scope):
  - Audit `src/styles/` — identify global resets/variables vs component styles
  - Keep global tokens (`src/styles/global.scss`): custom properties, font-face, resets
  - Rename each component stylesheet from `_component.scss` → `component.module.scss`
    and move next to its component file
  - Update component imports from global class references to `styles.className`
  - Update any test selectors that used hardcoded class names to use `data-testid`
    attributes or the module's exported name
- [ ] Delete `webpack/` directory (single commit after new config is verified working)
- [ ] Delete `webpack/loaders.js` inline Babel override (now handled by `@vitejs/plugin-react`)
- [ ] Run `npm test` — all suites must pass
- [ ] Verify dev server: `npm start`, confirm HMR works in browser
- [ ] Verify production build: `npm run build`, check UMD output and CSS file are emitted
- [ ] Update `PLAN.md` in reader-react
- [ ] Mark reader-react TASK-017 complete (it is absorbed into this task)

## Notes

- `css-loader` is at version 0.28.10 — ancient. Vite's built-in CSS handling
  replaces it entirely; no migration of its config is needed.
- `localIdentName` for CSS Modules in test: configure
  `css.modules.generateScopedName: '[local]'` in the test vite config so class
  names are predictable in tests.
- The custom config override pattern (`--config` CLI arg for themed builds)
  maps directly to `vite --config`. The lodash `setWith` deep-clone in
  `config.custom-example.js` can be replaced with Vite's `mergeConfig`.
- `b-ber-reader`'s webpack migration (TASK-007) depends on this task being
  complete first — `b-ber-reader` imports the compiled reader-react output.
- Jest still uses `babel-jest` for the test transform (the `jest-transform-upward.js`
  shim) — Vite does not affect the test pipeline. No jest config changes needed.
- See TASK-001 for full migration rationale and effort estimate (~2–3 days).
