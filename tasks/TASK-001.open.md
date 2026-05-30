# TASK-001: Research and recommend a webpack replacement

**Status:** not started
**Scope:** monorepo
**Priority:** medium

## Description

The monorepo currently uses webpack 5 as the bundler for `b-ber-reader-react`
and several other packages. Webpack's configuration complexity, slow cold-start
build times, and large plugin surface area are maintenance burdens. Research
modern alternatives and produce a recommendation with a migration plan.

Candidates to evaluate:

- **Rsbuild** (Rspack-based, webpack-compatible, drop-in config migration)
- **Vite** (esbuild dev / Rollup prod; excellent for React; ESM-native)
- **esbuild** (raw speed; limited plugin ecosystem; best for libraries)
- **Parcel** (zero-config; less suitable for complex monorepo setups)

## Subtasks

- [ ] Document what webpack is currently doing in each affected package:
  - `b-ber-reader-react` (dev server + production bundle + CSS processing)
  - Any other packages with their own `webpack.config.js`
- [ ] Evaluate each candidate against the current build requirements:
  - CSS Modules support (required for TASK-017 in reader-react)
  - SCSS compilation
  - Dev server with hot reload
  - Production bundle with minification and source maps
  - Compatibility with the existing Babel config (`babel.config.js`)
  - Lerna / npm workspaces compatibility
- [ ] Check community adoption, maintenance status, and breaking-change risk
- [ ] Identify any b-ber-specific blockers (e.g. custom loaders, webpack plugins in use)
- [ ] Write a recommendation: which tool, migration order (reader-react first?),
      rough effort estimate
- [ ] Open follow-up implementation tasks once a tool is chosen

## Notes

- Do not start migration in this task — this is research only.
- The webpack → new-bundler migration and the SCSS → CSS Modules migration
  (reader-react TASK-017) may be worth doing in a single pass if the new bundler
  handles CSS Modules differently. Coordinate the two tasks.
- Check whether `b-ber-reader` (legacy reader) has its own build config that
  would also need migrating, or whether it can be left on webpack indefinitely.
- Rsbuild is the leading candidate because it offers a webpack-compatible
  migration path (similar config shape, existing webpack plugins often work),
  which lowers the risk of a big-bang rewrite.
