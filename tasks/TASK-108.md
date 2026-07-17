# TASK-108: Nav header buttons don't open when the SVG icon is clicked

**Status:** complete
**Feature:** React 19 (reader-react)
**Phase:** Bug Fixes
**Priority:** medium
**Model:** Sonnet 4.6 — likely a one-line CSS/markup fix.

## Description

The header nav buttons (menu/chapters and downloads, top-right) open their
sidebars when the **button** is clicked, but **not** when the click lands on the
**SVG icon inside** the button. Surfaced during TASK-106 browser QA
(2026-06-15). Almost certainly **pre-existing**, not a state-migration
regression.

## Root cause (confirmed by analysis)

A **detached event target**, not a timing race. When the click lands on the
icon, `event.target` is the `<svg>`/`<path>`. The button's `onClick` toggles the
sidebar open, which swaps the button's child icon (`<Menu/>` → `<Close/>`); React
flushes that re-render synchronously for the discrete click, **unmounting the
exact node that was clicked**. The native document-level outside-click handler in
`Controls` then runs (the event keeps bubbling up to `document`) with `event.target`
now detached from the tree, so `target.closest('.bber-nav__button')` resolves to
`null` and the handler treats the opening click as an outside click. Clicking the
button padding works because the `<button>` itself never detaches.

## Fix

`pointer-events: none` on `.bber-nav__button svg` (`src/styles/_controls.scss`),
so the click target is always the `<button>` (which never detaches) regardless of
where inside it the user clicks. Scoped to the header nav icons only — media
controls keep their pointer events.

## Subtasks

- [x] Reproduce: click precisely on the icon glyph vs. the button padding
      (surfaced in QA; mechanism traced)
- [x] Confirm root cause — **detached target on icon swap**, refining the
      original race/`pointer-events` hypothesis
- [x] Apply the minimal fix (`pointer-events: none` on the nav icons)
- [x] Verify open/close still works for both the button and the icon, and
      outside-click dismissal is unaffected (browser QA, port 3000 — passed
      2026-06-18)
- [x] `npm test` green + 9 snapshots unchanged (CSS-only; component snapshots
      unaffected)

## Notes

- Files: `src/components/Controls.tsx` (outside-click handler),
  `src/components/Navigation/NavigationHeader.tsx`,
  `src/components/Navigation/Icon.tsx`, `src/styles/_controls.scss`.
- Related: [[TASK-106]] (surfaced during QA).
