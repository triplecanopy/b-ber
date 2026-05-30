# TASK-007: Migrate b-ber-reader to Vite and clean up babel.config.js

**Status:** not started
**Scope:** reader, monorepo
**Priority:** medium

## Description

After TASK-006 completes the reader-react Vite migration, migrate the legacy
`b-ber-reader` deployment shell from webpack and clean up the root
`babel.config.js` to remove webpack-era Babel transforms. This is the second
and final bundler migration step.

**Depends on TASK-006 being merged first.**

## Branch

Continue on `feat/vite-migration` or open a follow-up PR on the same branch.

## Subtasks

- [ ] In `b-ber-reader`:
  - Install `vite`; uninstall `webpack`, `webpack-cli`, `html-webpack-plugin`,
    `style-loader`, `css-loader`, `url-loader`, `babel-loader`
  - Write `vite.config.js`:
    - `@vitejs/plugin-react` for JSX
    - `resolve.alias`: `react` and `react-dom` aliased to monorepo root
      `node_modules/react` and `node_modules/react-dom` to prevent duplicate
      React instances (replaces webpack `alias` config)
    - `build.outDir: 'dist'`
    - HtmlPlugin not needed — Vite handles `index.html` natively
  - Add `index.html` to `src/` if not present (Vite entry point)
  - Update `package.json` `build` script: `vite build`
  - Delete `webpack.config.js`
  - Run the build and verify `dist/` output is correct
- [ ] In root `babel.config.js`:
  - Remove `@babel/preset-react` from the `/b-ber-reader/` override (now
    handled by `@vitejs/plugin-react` in Vite)
  - Remove the three now-built-in proposal plugins from all presets:
    `@babel/plugin-proposal-class-properties`,
    `@babel/plugin-proposal-object-rest-spread`,
    `@babel/plugin-proposal-optional-chaining`
    (these are included in `@babel/preset-env` for modern targets)
  - Verify that all non-browser packages still compile and that `npm test`
    passes after the removal
- [ ] Run `npm test` from the monorepo root — all 65 suites must pass
- [ ] Run `b-ber-reader` production build and smoke-test the output in a browser

## Notes

- `b-ber-reader` is a thin deployment shell with no logic. Its webpack config
  is ~50 lines; the Vite config will be ~20 lines.
- The React alias is important: `b-ber-reader` renders `BberReader` from the
  compiled reader-react output. Without the alias, both packages would bundle
  their own React, causing the "two instances of React" error.
- The Babel proposal plugin removal is safe because `@babel/preset-env` with
  modern targets (`last 2 versions, > 2%`) has included these transforms since
  Babel 7.4 (2019).
- After this task, webpack is fully removed from the monorepo. Verify no
  `webpack` references remain in `package.json` files.
- See TASK-001 for full migration rationale.
