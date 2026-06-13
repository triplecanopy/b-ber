# TASK-084: Consolidate page-width geometry into Viewport.getPageWidth

**Status:** in progress
**Feature:** React 19 (reader-react)
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
  markers/inline nodes. **Decision (2026-06-13): this migration is folded into
  the HOC→hooks migration (React 19 Step 2).** `with-node-position` is a class
  HOC that gets rewritten as a hook there anyway, so the `getPageWidth` adoption
  happens in that pass with its dedicated marker-positioning QA — avoiding two
  separate touches to marker positioning. The core consolidation (this task) is
  complete; it closes on the shared spread-cluster browser QA.

## Subtasks

- [x] Add `Viewport.getPageWidth`
- [x] Use it in `Spread.jsx` and `getTranslateX`
- [x] `npm test` passes
- [~] Migrate `with-node-position.jsx` to the helper — **moved to the HOC→hooks
      migration (React 19 Step 2)**; the file is rewritten as a hook there.
- [ ] Browser QA (shared spread-cluster checklist: page turns advance by exactly
      one page; verify where `viewerSettings.width ≠ window.innerWidth`)
- [ ] Commit and update `PLAN.md`; remove `.open`

## Notes

- Files changed: `src/helpers/Viewport.js`, `src/components/Spread.jsx`,
  `src/components/Reader/index.jsx`.
