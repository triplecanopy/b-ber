# TASK-069: Replace per-Spread setInterval with ResizeObserver

**Status:** not started
**Phase:** Modernization — Phase 2
**Priority:** medium

## Description

Each `Spread` component currently creates its own `setInterval(updatePosition, 1000)`
to track `offsetLeft`. A chapter with many spreads creates N concurrent 1-second
intervals, all reading from the DOM every second indefinitely.

This is IMPROVEMENT_PLAN item H3. It is the last remaining Phase 2 item.

## Approach

Replace the per-spread `setInterval` with a `ResizeObserver` on the Spread's own
DOM node. The observer fires only when the element's size changes (e.g., on window
resize or breakpoint change), eliminating polling.

Note: The current `Spread.jsx` already uses a `ResizeObserver` and `viewerSettingsRef`
(added in TASK-066) — the `setInterval` may have already been removed. Verify the
current state of `Spread.jsx` before starting.

## Subtasks

- [x] Audit current `Spread.jsx` — `setInterval` is already gone; `ResizeObserver` is in place (added as part of TASK-066 fixes)
- [ ] Confirm `updatePosition` is called once synchronously on mount (before any resize event fires) so initial layout is always correct
- [ ] Confirm no performance regression in chapters with many spreads (manual test)
- [ ] Run `npm test`
- [ ] Update `PLAN.md`

## Notes

- `Spread.jsx` already uses `ResizeObserver` at line 79 — the `setInterval` was removed during the TASK-066 Bug 2 fix passes.
- The remaining work is a verification and any gap-filling, not a full replacement.
