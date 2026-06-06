# TASK-028: Replace Ultimate offsetLeft polling with event-driven settle detection

**Status:** not started
**Phase:** Modernization
**Priority:** low
**Created:** 2026-06-06

## Description

`Ultimate.jsx` detects layout stability with a self-rescheduling `setTimeout`
that reads `offsetLeft` every 100ms until it stops changing. This violates the
package "No polling" standard (`AGENTS.md`), and each read forces a synchronous
reflow. See `READER_BUGS.md` (BUG 9).

It is also one of three independent "wait for the columns layout to settle"
implementations (here, `with-last-spread-index`, and `Spread`), each with a
different threshold, so they can resolve at slightly different moments.

### Why this is non-trivial

The reason `offsetLeft` polling was chosen is that the thing being detected — a
CSS multi-column reflow that shifts content horizontally — does **not** reliably
change any element's box size or child list, so `ResizeObserver` /
`MutationObserver` do not fire on it. A naive observer swap would reintroduce the
"never settles" / "settles too early" bugs. TASK-023 strengthened the polling
criterion as an interim measure.

### Proposed direction

- Investigate a quiet-period detector: combine `MutationObserver` +
  `ResizeObserver` (for the events they *can* see) with a short debounce, plus a
  bounded `requestAnimationFrame` confirmation that `offsetLeft` has stopped —
  measuring at most a handful of frames rather than polling indefinitely.
- Consolidate the three settle-detectors into a single authoritative
  "layout settled" signal that `Spread`, `withLastSpreadIndex`, and
  `with-node-position` all subscribe to (ties in with TASK-027).

## Subtasks

- [ ] Prototype an event-driven + bounded-rAF settle detector
- [ ] Confirm it settles correctly across slow font loads, image decode, and
      resize, in Chrome / Firefox / Safari
- [ ] Replace the `setTimeout` poll in `Ultimate.jsx`
- [ ] Consolidate the duplicate settle-detection in `withLastSpreadIndex` /
      `Spread` against the single signal
- [ ] `npm test`; commit; update `PLAN.md`; remove `.open`

## Notes

- Lower priority than the correctness fixes (TASK-022 through TASK-026): the
  current polling works once TASK-023's criterion is in place; this is a
  standards/cleanliness and architecture improvement.
- Related: TASK-023 (interim criterion hardening), TASK-027 (single loading/
  settled signal).
- Files likely involved: `src/components/Ultimate.jsx`,
  `src/lib/with-last-spread-index.jsx`, `src/components/Spread.jsx`.
