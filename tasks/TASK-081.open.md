# TASK-081: Fix stale full-bleed spread column position (verso/recto)

**Status:** in progress
**Feature:** React 19 (reader-react)
**Phase:** Bug Fixes
**Priority:** high
**Created:** 2026-06-06

## Description

QA reported full-bleed spreads rendering with blank/empty pages, overlapping
content, and misplaced figures — intermittently, often only at certain window
widths. Root cause analysis is in `READER_BUGS.md` (BUG 1, with related cleanup
BUG 7, BUG 8, BUG 10).

### Root cause (BUG 1)

`Spread.jsx` derives a spread's verso/recto classification (and therefore its
column-spanning `multiplier`, its spacer height, and the `SpreadContext.left`
used to position the `SpreadFigure`) from the element's `offsetLeft` — a
*position*. The recent rewrite replaced the old `setInterval(updatePosition,
1000)` poll with a `ResizeObserver`. But `ResizeObserver` only fires on
box-*size* changes; when the CSS columns engine reflows and the spread lands in
a different column, its `offsetLeft` changes while its box size does not, so the
observer never fires. The effect's dependency array was only the padding/gap
values, so it never re-ran on chapter change, content reflow, or layout settle.
The single synchronous `updatePosition()` ran once in `useEffect` — before the
columns layout had settled — and the stale reading was never corrected.

### Fix implemented

- `Spread.jsx` now re-reads `offsetLeft` when the layout-settled signal changes:
  subscribed `Spread` to the Redux `view` slice and added `view.loaded` and
  `view.ultimateOffsetLeft` (dispatched by `Ultimate` once `offsetLeft` stops
  moving) to the measurement effect's dependency array.
- **Convergence loop (cascade fix).** Real-Chrome testing (1792×1041) showed a
  spread frozen at a stale offset — physically at an integer (verso) column
  (`offset 11`) but stuck classified `recto`, reserving an extra column and
  leaving a blank page (confirmed by `scrollHeight` being exactly one column
  larger than the corrected layout). Root cause is a *cascade*: each spread
  measures its own `offsetLeft`, but when an earlier spread corrects its height
  (verso↔recto) — or a late image/font load reflows content — every later
  spread's `offsetLeft` shifts without changing its own box size, so its
  `ResizeObserver` never fires and the one-shot settle re-read can be
  invalidated by a sibling's later correction. `Spread` now re-measures across
  animation frames (applying each reading so a multiplier change drives the next
  reflow) until `offsetLeft` is unchanged for a frame, bounded by
  `MAX_STABILIZE_FRAMES`. Verified in headless Chrome that spreads settle to the
  correct columns and are stable across samples (no oscillation).
- BUG 10: guard against a non-finite / zero `pageWidth` before dividing (also
  covers the vertical-scroll layout where `viewerSettings.width === 'auto'`).
- BUG 7: derive `verso` and `multiplier` inline from `offset` instead of storing
  them as state set in a `useLayoutEffect` (which left them a render out of phase
  with `offset`). Removed the now-dead `left`/`verso`/`multiplier` state and the
  layout effect.
- BUG 8: `spread-context.js` default `left` changed from the string `'0px'` to
  numeric `0` (`Math.floor('0px')` is `NaN`, which would push a figure
  off-screen if a `SpreadFigure` ever rendered without a `Spread` provider).
- Removed dead commented-out `opacity` in `SpreadFigure.jsx`.

## Subtasks

- [x] Identify why spreads are misclassified after layout settles
- [x] Re-measure `Spread` position on the `view.loaded` / `view.ultimateOffsetLeft` signal
- [x] Add bounded convergence loop so spreads re-measure through the cascade
      (sibling height corrections + late image/font reflow) until stable
- [x] Guard the `pageWidth` division (BUG 10)
- [x] Derive `verso`/`multiplier` inline; remove redundant state (BUG 7)
- [x] Use numeric default in `spread-context.js` (BUG 8)
- [x] `npm test` passes (18 suites)
- [ ] Verify in browser: `spreads-testing-nov-2024` and a text-heavy project,
      especially at an odd window width (~1425px, fractional `paddingLeft`)
- [ ] Verify across Chrome, Firefox, Safari
- [ ] Commit and update `PLAN.md`; remove `.open`

## Notes

- Depends on TASK-082 (reliable `Ultimate` settle signal) — without it the
  `view.ultimateOffsetLeft` trigger can fire mid-reflow.
- Files changed: `src/components/Spread.jsx`, `src/components/SpreadFigure.jsx`,
  `src/lib/spread-context.js`, plus `Viewport.getPageWidth` (see TASK-084).
- See `READER_BUGS.md` for the full analysis and verification notes.
