# TASK-076: Migrate from SCSS to CSS Modules

**Status:** not started
**Feature:** React 19 (reader-react)
**Phase:** Modernization — Phase 6
**Priority:** low

## Description

Replace the current global SCSS stylesheet (`src/index.scss` + imported partials) with
CSS Modules so that component styles are co-located with their components, scoped by
default, and no longer rely on global class-name conventions.

This eliminates the risk of style bleed between the reader and the host application,
makes unused styles tree-shakeable, and aligns with the direction of the rest of the
React ecosystem.

## Subtasks

- [ ] Audit current SCSS structure — identify global resets/variables that must stay global vs. component-scoped styles
- [ ] **Migrate `@import` → `@use`/`@forward`** (Sass module system). `src/index.scss`
      `@import`s its 10 partials with the legacy `@import` rule, which Dart Sass
      deprecates (removed in Dart Sass 3.0) and warns about on every `npm start`.
      Partials are cleanly layered (`_variables` → `_mixins` → the rest;
      `_mixins.scss` already uses `@use 'sass:list'`), so this is ~8 files of
      one-line `@use '…' as *` additions. **Verify the compiled CSS is
      byte-identical** (`npx sass src/index.scss` before/after). If the CSS
      Modules pass lands first and rewrites these files anyway, do it there; if
      not, this is worth doing on its own to clear the warnings. (Surfaced
      2026-06-17 via dev-server deprecation warnings — they are our own SCSS, not
      a third-party lib; `sass` is already current.)
- [ ] Evaluate whether to keep SCSS syntax (`*.module.scss`) or migrate to plain CSS (`*.module.css`) in the same pass
- [ ] Enable CSS Modules in the build config (**Vite** — `vite.config.js` /
      `vite.config.lib.js`; the package migrated off webpack). With Vite, CSS
      Modules work out of the box for `*.module.{css,scss}` files; tune
      `css.modules.generateScopedName` to keep readable class names in dev/test.
- [ ] Migrate leaf components first (Spinner, NavigationFooter button styles) as a proof-of-concept
- [ ] Migrate remaining components (Layout, Controls, Frame, Spread, BookContent, Ultimate)
- [ ] Migrate HOCs (withDimensions, withLastSpreadIndex)
- [ ] Remove global `src/index.scss` import from `src/index.jsx` once all styles are migrated
- [ ] Run `npm test` — confirm all smoke tests still pass
- [ ] Manually verify in dev environment (columns layout, scroll layout, spreads, mobile)
- [ ] Update `PLAN.md`

## Notes

- The current `src/index.scss` imports partials from `src/styles/`. These partials mix
  component styles with global resets and CSS custom properties. The global tokens
  (custom properties, font-face declarations, resets) should remain in a single
  `src/styles/global.css` imported once at the app entry point.
- Class names in tests (`container.querySelector('.bber-controls__footer')`) will break
  if CSS Modules generates hashed names. Use `composes` or configure Vite's
  `css.modules.generateScopedName` to preserve readable names in test/dev, or update
  tests to use `data-testid` attributes.
- Do not proceed until TASK-067 (active bugs) is resolved — migrating styles on top of
  a broken navigation path makes regression detection harder.
- **Build tool is Vite now** (`vite.config.js` for dev, `vite.config.lib.js` for the
  library build) — the earlier webpack/rsbuild references in this task are stale. Vite
  handles CSS Modules natively, so no loader config is needed; this lowers the cost of
  the migration.
