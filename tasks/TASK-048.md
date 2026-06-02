# TASK-048: Convert b-ber-resources to TypeScript

**Status:** complete
**Scope:** b-ber-resources
**Priority:** low

## Description

`b-ber-resources` is the last non-TypeScript core package still using `@babel/cli`
for its build step. It has a single source file (`src/index.js`, ~15 lines) that
reads the package's image assets at runtime and returns them as a path map.

Converting it follows the same pattern as every other package in Stages 1–3:
rename source to `.ts`, add tsdown config and tsconfigs, replace Babel devDeps
with `typescript` (hoisted), update `package.json` scripts and `main`/`types`
fields. The `@babel/cli`, `@babel/core`, `@babel/preset-env`, and `browserslist`
devDeps are removed.

One path adjustment is required: the current Babel build outputs `index.js`
directly to the package root, so `__dirname` in the compiled output correctly
resolves to where the PNG assets live. After the switch to tsdown (which outputs
to `dist/`), the compiled file lives one level deeper, so the path becomes
`path.resolve(__dirname, '..')`.

## Subtasks

- [x] Create `src/index.ts`
- [x] Create `tsconfig.json` and `tsconfig.build.json`
- [x] Create `tsdown.config.ts`
- [x] Update `package.json` (scripts, deps, main, types, files)
- [x] Update `jest.config.js` to use `@swc/jest`
- [x] Remove `jest-transform-upward.js`
- [x] Delete old `index.js` build artifact from package root
- [x] Run `npm test` in package — passes

## Notes

Branch: `feat/upgrades`

The `__dirname` adjustment: previous compiled output at `./index.js` sees
`__dirname === <package-root>`. New compiled output at `dist/index.js` sees
`__dirname === <package-root>/dist`. Using `path.resolve(__dirname, '..')`
restores the correct package-root resolution.

`jest-transform-upward.js` was present in this package but referenced only by
the (now-replaced) jest config transform. Safe to delete.
