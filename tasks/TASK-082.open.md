# TASK-082: Harden Ultimate layout-stability detection

**Status:** in progress
**Feature:** React 19 (reader-react)
**Phase:** Bug Fixes
**Priority:** high
**Created:** 2026-06-06

## Description

`Ultimate.jsx` is the layout-stability sentinel: it polls the sentinel span's
`offsetLeft` and, once the CSS columns layout has settled, dispatches
`view.load()` + `updateUltimateNodePosition`, which hides the spinner and signals
downstream consumers that positions are trustworthy. See `READER_BUGS.md` (BUG 2).

### Root cause (BUG 2)

The previous implementation required `maxChecks = 100` consecutive stable
`requestAnimationFrame` readings (~1.6s of no movement). The rewrite declared the
layout stable after just **two** matching `offsetLeft` samples taken 100ms apart.
A CSS columns reflow commonly plateaus for one interval and then shifts again
(e.g. a web font finishes loading, an image decodes), so a single 100ms plateau
satisfied the test and `onStable()` fired mid-reflow — publishing premature
positions that every downstream measurement (spread positioning, page count)
then read while the layout was still moving.

### Fix implemented

- Require `REQUIRED_STABLE_CHECKS = 3` consecutive unchanged `offsetLeft` samples
  before declaring stable (`stableCountRef` resets whenever `offsetLeft` moves).
- Re-arm the watch on `document.fonts.ready` (the classic late reflow): when
  fonts resolve, reset the baseline and counter so the layout must re-confirm
  stability. Guarded by `activeRef` and a `document.fonts?.ready` existence check
  (absent in jsdom).
- Raised `MAX_WAIT_MS` 1500 → 2500 to give a late font reflow room to re-settle
  before the hard-timeout safety valve fires.

## Subtasks

- [x] Strengthen the stability criterion to N consecutive stable reads
- [x] Re-arm on `document.fonts.ready`
- [x] Raise `MAX_WAIT_MS`
- [x] Update `Ultimate.smoke.test.jsx` for the new criterion; `npm test` passes
- [ ] Verify in browser that the spinner hides at the right time on chapter load
- [ ] Commit and update `PLAN.md`; remove `.open`

## Notes

- This is the foundation for TASK-081 and TASK-083 — both now key off the
  `view.loaded` / `view.ultimateOffsetLeft` signal this component publishes, so
  the signal must be trustworthy.
- `Ultimate` still polls `offsetLeft`; replacing polling entirely is tracked
  separately in TASK-087 (BUG 9). Polling is the pragmatic detector here because
  observers cannot see column-reflow position changes.
- Files changed: `src/components/Ultimate.jsx`,
  `__tests__/components/Ultimate.smoke.test.jsx`.
