# TASK-001: Research and recommend a webpack replacement

**Status:** complete
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #456 — https://github.com/triplecanopy/b-ber/issues/456

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

- [x] Document what webpack is currently doing in each affected package:
  - `b-ber-reader-react` (dev server + production bundle + CSS processing)
  - Any other packages with their own `webpack.config.js`
- [x] Evaluate each candidate against the current build requirements:
  - CSS Modules support (required for TASK-017 in reader-react)
  - SCSS compilation
  - Dev server with hot reload
  - Production bundle with minification and source maps
  - Compatibility with the existing Babel config (`babel.config.js`)
  - Lerna / npm workspaces compatibility
- [x] Check community adoption, maintenance status, and breaking-change risk
- [x] Identify any b-ber-specific blockers (e.g. custom loaders, webpack plugins in use)
- [x] Write a recommendation: which tool, migration order (reader-react first?),
      rough effort estimate
- [x] Open follow-up implementation tasks: TASK-006 (reader-react), TASK-007 (b-ber-reader)

## Research Findings

### What webpack is currently doing

**b-ber-reader-react** (primary target):

- Dev server: `webpack-dev-server` on port 3000 with HMR + live reload
- Two entry points: `index.jsx` (app) and `index.scss` (styles compiled separately)
- Loaders: `babel-loader` (with inline Babel config overriding the root), `sass-loader`
  (Dart Sass), `css-loader`, `MiniCssExtractPlugin.loader`, `postcss-loader`
  (autoprefixer + cssnano in prod), `url-loader` for fonts/images/SVGs
- Plugins: `MiniCssExtractPlugin`, `DefinePlugin`, `NoEmitOnErrorsPlugin`,
  `RemoveEmptyScriptsPlugin`, optional `BundleAnalyzerPlugin`
- Production: externals for React/ReactDOM, UMD library output (`BberReader`),
  minification enabled, source maps off
- Browser polyfills: `stream-browserify`, `buffer`, `os-browserify` (needed by
  `sax-js`/`detect-browser` transitive deps)
- Custom config override: supports passing an alternate config file at CLI
- Notably missing: CSS Modules (currently plain global SCSS — TASK-017 would add)
- `css-loader` version is ancient (0.28.10) — a symptom of dependency tree drift

**b-ber-reader** (legacy deployment shell):

- Single entry (`src/index.js`), `HtmlWebpackPlugin`, `babel-loader`,
  `style-loader` + `css-loader`, `url-loader` for fonts
- React/ReactDOM aliased to monorepo root to prevent duplicate instances
- Production-only build (no dev server); serves via Express
- Has its own `.babelrc` (`@babel/preset-env` + `@babel/preset-react`)

### Recommendation: Vite

**Rsbuild is not the right choice** despite being the original leading candidate.
Rsbuild's advantage is a webpack-compatible migration path, but the reader-react
webpack config is only ~120 lines. Migrating it faithfully to Rsbuild preserves
existing complexity rather than eliminating it. The Rspack ecosystem is also less
mature than Vite's for React development.

**Vite wins because:**

- SCSS: built-in, just install `sass`
- CSS Modules: first-class, zero config for `*.module.scss` — TASK-017 becomes
  trivial to combine with this migration
- Dev server with HMR: best-in-class, significantly faster than webpack-dev-server
- React: official `@vitejs/plugin-react` handles all Babel transforms including
  JSX, class properties, optional chaining — the inline Babel override in
  `webpack/loaders.js` can be deleted entirely
- Production UMD builds: Rollup-based `lib` mode supports the `BberReader` UMD
  output; `build.rollupOptions.external` replaces webpack `externals`
- Browser polyfills: `vite-plugin-node-polyfills` covers `stream`/`buffer`/`os`
- Custom config override: `--config` CLI flag, identical semantics to current pattern
- Lerna/npm workspaces: Vite resolves symlinked packages correctly; `optimizeDeps.include`
  handles the `file:` link from `b-ber-reader` to `b-ber-reader-react`

**esbuild**: Too low-level. Lacks SCSS and CSS Modules out of the box. Best for
pure library transforms, not a full dev + build pipeline.

**Parcel**: The custom-config-file-override CLI pattern (themed builds) is
incompatible with Parcel's model. Also poor fit for UMD library output.

### CSS Modules coordination (TASK-017)

Do both migrations in a single pass. Under Vite, CSS Modules are enabled
automatically for `*.module.scss` — there is no webpack `modules: true` flag
to set. The TASK-017 note about `localIdentName` for tests applies equally to
Vite (`css.modules.generateScopedName`). Running them together avoids doing
the SCSS audit twice.

### Migration sequencing

1. **reader-react first** (active development, has the dev server):
   a. Replace `webpack/` directory with `vite.config.js` (dev) and
   `vite.config.lib.js` (prod UMD build)
   b. Add `@vitejs/plugin-react`; delete inline Babel config in `loaders.js`
   c. Add node polyfills for `stream`/`buffer`/`os`
   d. Add thin `dev/index.html` entry (Vite uses `index.html` as default entry)
   or use `build.lib` mode throughout
   e. Run TASK-017 CSS Modules migration concurrently
2. **b-ber-reader second** (much simpler; 2–4 hours):
   - Replace webpack config with `vite.config.js`; `resolve.alias` for React dedup
   - Update `build` script to call `vite build`
3. **Root babel.config.js cleanup**:
   - Remove `@babel/preset-react` from the `/b-ber-reader/` override (now in
     `@vitejs/plugin-react`)
   - Drop the three now-standard proposal plugins (`class-properties`,
     `object-rest-spread`, `optional-chaining`)

### Blockers and risks

- **UMD library output**: Vite lib mode supports UMD but requires explicit entry
  file and `name: 'BberReader'`. Separate CSS extraction is automatic in lib mode.
- **`RemoveEmptyScriptsPlugin`**: Only needed because of the separate `styles` entry
  point. Vite lib mode does not emit spurious JS chunks for CSS — eliminated.
- **`html-webpack-plugin` v4**: Vite replaces this entirely — just delete it.
- **`config.custom-example.js` pattern**: Vite's `mergeConfig` helper replaces
  the lodash `setWith` deep-clone approach — slightly cleaner.

### Effort estimate

- reader-react + TASK-017 combined: 2–3 days (most time is CSS Modules audit)
- b-ber-reader: 2–4 hours
- babel.config.js cleanup: 1 hour
- Total: ~3 days for complete migration including CSS Modules

## Notes

- Do not start migration in this task — this is research only.
- See TASK-002 for sequencing this against the JS→TS migration.
  Recommendation: do bundler migration first (or concurrently with CSS Modules),
  then add TypeScript to reader-react on the new bundler where TS support is free.
