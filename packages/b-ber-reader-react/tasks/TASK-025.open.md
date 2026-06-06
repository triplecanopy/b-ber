# TASK-025: Consolidate page-width geometry into Viewport.getPageWidth

**Status:** in progress
**Phase:** Bug Fixes
**Priority:** medium
**Created:** 2026-06-06

## Description

The "page width" — the distance one page turn translates the layout, and the
unit spread positioning divides by — was reimplemented with three subtly
different formulas. See `READER_BUGS.md` (BUG 4).

- `Spread.jsx` (×2): `window.innerWidth - paddingLeft - paddingRight + columnGap`
- `Reader/index.jsx` `getTranslateX`: `width - paddingLeft - paddingRight + columnGap`
  (uses `viewerSettings.width`, not `window.innerWidth`)
- `with-node-position.jsx` (×2): `window.innerWidth - paddingLeft * 2 + columnGap`
  (assumes `paddingLeft === paddingRight`)

They agree only when `viewerSettings.width === window.innerWidth` **and**
`paddingLeft === paddingRight`. When they diverge (scrollbar width, fractional
device-pixel rounding, asymmetric padding), the page-turn transform steps by a
different amount than the figure positioning computes → the figure sits half a
page off → overlap / blank. (Note a fourth variant, `getFrameWidth()`, uses
`- columnGap`, so it is intentionally *not* interchangeable.)

### Fix implemented (partial)

- Added `Viewport.getPageWidth(viewerSettings)` =
  `width - paddingLeft - paddingRight + columnGap` as the single source of truth
  (sourced from `viewerSettings.width`, which equals `window.innerWidth` in the
  columns layout; returns `NaN` in scroll layout, callers guard).
- `Spread.jsx` and `Reader` `getTranslateX` now both call it, so spread
  positioning and the page-turn transform can no longer diverge.

### Remaining

- `with-node-position.jsx` still uses its own `paddingLeft * 2` variant in two
  places. Migrating it requires confirming padding symmetry assumptions for
  markers/inline nodes; deferred to avoid a behavioral change to marker
  positioning without dedicated testing.

## Subtasks

- [x] Add `Viewport.getPageWidth`
- [x] Use it in `Spread.jsx` and `getTranslateX`
- [x] `npm test` passes
- [ ] Migrate `with-node-position.jsx` to the helper (verify marker positioning
      with the `spreads-testing-nov-2024` project and any project with markers)
- [ ] Commit and update `PLAN.md`; remove `.open`

## Notes

- Files changed: `src/helpers/Viewport.js`, `src/components/Spread.jsx`,
  `src/components/Reader/index.jsx`.
