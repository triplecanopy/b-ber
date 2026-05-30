# TASK-017: Migrate from SCSS to CSS Modules

**Status:** not started
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
- [ ] Evaluate whether to keep SCSS syntax (`*.module.scss`) or migrate to plain CSS (`*.module.css`) in the same pass
- [ ] Update webpack config (`webpack.config.js`) to enable CSS Modules (`modules: true` on css-loader)
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
  if CSS Modules generates hashed names. Use `composes` or configure `localIdentName`
  to preserve readable names in test/dev, or update tests to use `data-testid` attributes.
- Do not proceed until TASK-008 (active bugs) is resolved — migrating styles on top of
  a broken navigation path makes regression detection harder.
- Consider doing this in the same pass as the webpack → rsbuild migration (root TASK-001)
  if build-tool changes alter how CSS is processed anyway.
