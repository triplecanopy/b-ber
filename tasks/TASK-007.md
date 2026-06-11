# TASK-007: Migrate b-ber-reader to Vite and clean up babel.config.js

**Status:** complete
**Feature:** Upgrade tooling
**Scope:** reader, monorepo
**Priority:** medium
**GitHub Issue:** #473 — https://github.com/triplecanopy/b-ber/issues/473

## Description

After TASK-006 completes the reader-react Vite migration, migrate the legacy
`b-ber-reader` deployment shell from webpack and clean up the root
`babel.config.js` to remove webpack-era Babel transforms. This is the second
and final bundler migration step.

**Depends on TASK-006 being merged first.**

## Branch

Continue on `feat/vite-migration` or open a follow-up PR on the same branch.

## Subtasks

- [x] In `b-ber-reader`:
  - Install `vite`; uninstall `webpack`, `webpack-cli`, `html-webpack-plugin`,
    `style-loader`, `css-loader`, `url-loader`, `babel-loader`
  - Write `vite.config.js`:
    - `@vitejs/plugin-react` for JSX
    - `resolve.alias`: `react` and `react-dom` aliased to monorepo root
      `node_modules/react` and `node_modules/react-dom` to prevent duplicate
      React instances (replaces webpack `alias` config)
    - `build.outDir: 'dist'`
    - HtmlPlugin not needed — Vite handles `index.html` natively
  - Add `index.html` to package root (Vite entry point)
  - Update `package.json` `build` script: `vite build`
  - Delete `webpack.config.js`
  - Run the build and verify `dist/` output is correct
- [x] In root `babel.config.js`:
  - Remove `@babel/preset-react` from the `/b-ber-reader/` override (now
    handled by `@vitejs/plugin-react` in Vite)
  - Remove the three now-built-in proposal plugins from all presets:
    `@babel/plugin-proposal-class-properties`,
    `@babel/plugin-proposal-object-rest-spread`,
    `@babel/plugin-proposal-optional-chaining`
    (these are included in `@babel/preset-env` for modern targets)
  - Verify that all non-browser packages still compile and that `npm test`
    passes after the removal
- [x] Removed webpack and webpack loaders from root `package.json` devDependencies
- [x] Run `npm test` from the monorepo root — 84/84 suites pass
- [x] Run `b-ber-reader` production build and verify `dist/` output

## Notes

- `src/index.js` renamed to `src/index.jsx` since Vite only applies the React
  transform to `.jsx` files by default; the file already contained JSX.
- `b-ber-reader-react` pins `vite@^8.0.16` and `@vitejs/plugin-react@^6.0.2`.
  `b-ber-reader` uses the same versions to avoid a hoisting conflict that was
  causing lerna bootstrap to install a duplicate React instance in
  `b-ber-reader-react/node_modules/`, breaking the hook-call tests.
- `b-ber-reader-react/dist/index.js` is a UMD/CJS bundle. Because the symlink
  resolves to a path outside `node_modules/`, Vite's built-in CJS plugin
  doesn't match it by default. `commonjsOptions.include` is extended to cover
  the `b-ber-reader-react/dist` path pattern.
- Webpack is now fully removed from the monorepo. No webpack entries remain in
  any `package.json` files.
- See TASK-001 for full migration rationale.
