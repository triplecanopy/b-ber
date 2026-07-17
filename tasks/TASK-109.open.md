# TASK-109: Modernize the project/theme SCSS compile path

**Status:** not started
**Feature:** Upgrade tooling
**Scope:** tasks (b-ber-tasks), theme-serif, theme-sans
**Priority:** medium
**Origin:** [`TASK-076-findings.md`](./TASK-076-findings.md) — Recommendation B

## Description

The audit done for TASK-076 found that b-ber's styling problems are concentrated
in the **project/theme SCSS compile path** (the `sass` task in `b-ber-tasks`),
not in SCSS-the-language. SCSS stays — it's the public authoring API for book
designers (variable `_settings.scss` + `_overrides.scss`, the `$build` switch,
modular-scale math, mixins). What is dated is the *machinery* around it:

1. **The custom `~` (tilde) importer.** `b-ber-tasks/src/sass/index.ts` ships a
   hand-rolled `resolveImportedModule()` that strips the leading `~`, parses the
   path (handling `@scope/name`), and uses `require.resolve(..., { paths:
   [themeDir] })` to emulate webpack's "resolve from node_modules" convention.
   It exists **only** because the theme SCSS writes `@import '~modularscale-sass/…'`
   and `@import '~@canopycanopycanopy/b-ber-theme-mixins/application'`. Dart Sass
   has no `~` support, so we re-implemented node resolution by hand.

2. **The legacy Dart Sass `render()` API.** The task uses `dartSass.render(...)`
   (callback API) with a single `importer` callback, `includePaths`, and `data`.
   This is the deprecated legacy JS API; modern Dart Sass uses
   `compileStringAsync` with an `importers` array and `loadPaths`.

3. **`@import` everywhere** in the theme SCSS — deprecated by Dart Sass and
   removed in Dart Sass 3.0. (The reader's own `@import`s are TASK-076; this task
   covers **only** the theme/project SCSS: `b-ber-theme-serif`,
   `b-ber-theme-sans`, and the project `_stylesheets/` convention.)

4. **An aging PostCSS post-processing stack** — `autoprefixer@9` invoked
   manually via PostCSS in the sass task.

The goal is to remove the custom importer and the legacy API, clear the
deprecation warnings, and trim the post-processing stack — **without changing the
authoring API** and **without changing the compiled `application.css` output**
for existing books.

> **Scope boundary:** This task is the project/theme side (subsystems B + C in
> the findings doc). The reader's own SCSS → CSS Modules migration is **TASK-076**
> and is explicitly out of scope here. Do not touch `b-ber-reader-react`.

## Subtasks

- [ ] **Audit the compile path** — confirm `b-ber-tasks/src/sass/index.ts` is the
      only SCSS compiler for projects/themes, and enumerate every `~` import
      across `b-ber-theme-serif`, `b-ber-theme-sans`, and any documented project
      `_stylesheets/` examples. Note the `b-ber-theme-mixins` dependency is
      **published to npm and not in this monorepo** (it's resolved from
      node_modules).
- [ ] **Capture a golden output** — compile `application.css` for a representative
      sample project (one per `$build` target if feasible: `epub`, `web`, `mobi`)
      with the current toolchain and save it as a fixture. Every change below must
      be verified byte-identical (or diff-reviewed and explained) against these.
- [ ] **Drop the `~` syntax** — rewrite the theme `@import '~pkg/…'` statements to
      resolve packages via Dart Sass's **`loadPaths: [node_modules]`** or the
      official **`pkg:` importer**. Remove `resolveImportedModule()` and the custom
      `importer` callback entirely. (Coordinated: `theme-sans` imports `theme-serif`
      via `~` too — change them together.)
- [ ] **Migrate to the modern Dart Sass API** — replace `dartSass.render(...)`
      with `compileStringAsync` + `importers`/`loadPaths`. Preserve the runtime
      `$build` injection and the `_settings` → theme → `_overrides` concatenation
      order.
- [ ] **Migrate theme `@import` → `@use`/`@forward`** in `theme-serif` and
      `theme-sans`. Make the variable-override seam explicit (today `_settings.scss`
      is string-prepended; with `@use … with (...)` it becomes a configured
      module). Verify against the golden output.
- [ ] **Modernize post-processing** — bump `autoprefixer` (and PostCSS) to current
      majors, or evaluate replacing the manual PostCSS+autoprefixer+? step with
      **Lightning CSS** (prefixing + minify in one pass; could subsume `cssnano`).
      Keep the `production` compressed-output behavior.
- [ ] **Fix the `.foo` leak** — remove the leftover `.foo { font-size:
      $font-size-base; }` rule from `b-ber-theme-serif/application.scss` (it
      compiles into every book's CSS). *(Findings Risk 2.)*
- [ ] **Run `npm test`** for `b-ber-tasks` and any package that imports the sass
      task; per the test-propagation rule, run dependents too.
- [ ] **Verify a full build** — run an actual project build end-to-end and confirm
      the reader still renders book content correctly (the runtime css-tree scoper
      consumes this `application.css`).
- [ ] **Update `PLAN.md`** — add to the Upgrade tooling table; note the `~`
      removal closes the findings recommendation.

## Notes

- This is a **feature-branch** change (build-system + package outputs), not an
  integration-branch commit. Per AGENTS.md branch strategy, do this on a
  `feat/scss-toolchain` (or similar) branch, not directly on `feat/upgrades`.
- The user preference is **fewer deps, platform-first** ([[feedback-prefer-fewer-deps]]).
  Prefer the built-in Dart Sass `loadPaths`/`pkg:` importer over any new resolver
  lib, and weigh Lightning CSS (one tool) against keeping the current PostCSS
  stack.
- Consider pulling `b-ber-theme-mixins` into the monorepo (or documenting why it
  stays external) — its out-of-tree status is the original reason the `~` resolver
  had to exist. Raise separately if it grows beyond this task.
- Behavior preservation is the gate: the compiled `application.css` is a public
  build artifact consumed downstream (EPUB validators, the reader's runtime
  scoper). Treat the golden-output diff as the primary acceptance check.

Branch: `feat/scss-toolchain` (create from `feat/upgrades`)
