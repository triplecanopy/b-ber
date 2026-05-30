# TASK-007: Bug fix — full-bleed spreads out of sync (Bug 2)

**Status:** complete
**Phase:** Bug Fixes
**Created:** 2026-04-06

## Description

Fix full-bleed spreads rendering as two pages and displaying images on the wrong
`spreadIndex`. Two independent root causes required two separate fixes.

## Root Cause 1 — Stale closure in ResizeObserver callback (pass 9)

On cross-breakpoint resize, the ResizeObserver callback fired with stale
`props.viewerSettings.paddingLeft` from the old breakpoint while `offsetLeft`
already reflected the new layout. Mismatched arithmetic classified a verso spread
as recto (`multiplier = 3` instead of `2`), producing a spurious second page.

## Root Cause 2 — Sub-pixel float misclassification (pass 10)

`paddingLeft = (window.innerWidth - maxWidth) / 2` is fractional when
`(innerWidth - maxWidth)` is odd. Chrome snaps column positions to whole-pixel
boundaries, so `offsetLeft` is an integer while `paddingLeft` is not. The raw
`offset = (offsetLeft - paddingLeft) / pageWidth` was a tiny non-zero value,
misclassifying the spread as recto on every odd window width — no resize needed.

## Fix

- **Pass 9:** Add `viewerSettingsRef` (always-current ref updated during render) so
  the ResizeObserver callback always reads current `paddingLeft`.
- **Pass 10 (updatePosition):** Round `rawOffset` to nearest 0.5 via
  `Math.round(rawOffset * 2) / 2` to absorb sub-pixel float error.
- **Pass 10 (spreadContextValue):** Replace `offsetLeft`-based `nextLeft` formula
  with `offset × pageWidth` to avoid all `offsetLeft - paddingLeft` arithmetic.

## Subtasks

- [x] Add `viewerSettingsRef` to `Spread.jsx`; read from ref in `updatePosition` (pass 9)
- [x] Round `rawOffset` to nearest 0.5 in `updatePosition` (pass 10)
- [x] Replace `offsetLeft`-based `nextLeft` formula in `spreadContextValue` (pass 10)
- [x] Update dep arrays accordingly (pass 10)

## Notes

- Files changed: `src/components/Spread.jsx`.
- Testing: single full-bleed at 1425×1046, DESKTOP_LG → DESKTOP_MD resize, DESKTOP_MD → DESKTOP_LG resize, resize within breakpoint, multi-spread chapters, scroll layout.
