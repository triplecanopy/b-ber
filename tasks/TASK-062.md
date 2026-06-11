# TASK-062: Ultimate.jsx modernization

**Status:** complete
**Feature:** React 19 (reader-react)
**Phase:** Modernization — Phase 2
**Created:** 2026-04-04
**GitHub Issue:** #463 — https://github.com/triplecanopy/b-ber/issues/463

## Description

Replace the RAF polling loop in `Ultimate.jsx` with an event-driven approach, and
convert the class component to a functional component. This addresses
IMPROVEMENT_PLAN items C1 and C3.

## Approach

- Convert from class to functional component
- Replace 60fps RAF loop with a `ResizeObserver` on the sentinel element (pass 2)
- When ResizeObserver caused spinner to never hide (pass 4): removed it, kept
  self-rescheduling `setTimeout` that polls `offsetLeft` at 100ms intervals
- Replace `UNSAFE_componentWillReceiveProps` with `useEffect` + `useRef` prev-value tracking
- Add `MAX_WAIT_MS = 3000` fallback so spinner always hides even if layout never settles (pass 5)

## Subtasks

- [x] Convert class component → functional component
- [x] Replace RAF loop with ResizeObserver + debounce (pass 2)
- [x] Replace `UNSAFE_componentWillReceiveProps` with `useEffect` (pass 2)
- [x] Remove ResizeObserver (caused continuous reset); keep self-rescheduling setTimeout (pass 4)
- [x] Add `MAX_WAIT_MS = 3000` hard timeout for stability (pass 5)

## Notes

- The ResizeObserver on `#frame` was continuously reset because `#frame` has
  `position: absolute; top/left/right/bottom: 0` — font loading repeatedly resizes it.
- The self-rescheduling `setTimeout` polling `offsetLeft` proved more reliable for
  detecting column layout stability.
- Files changed: `src/components/Ultimate.jsx`.
