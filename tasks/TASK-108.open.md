# TASK-108: Nav header buttons don't open when the SVG icon is clicked

**Status:** not started
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

## Likely cause

`Controls`'s document-level outside-click handler decides whether to dismiss an
open sidebar via `target.closest('.bber-controls__sidebar')` /
`target.closest('.bber-nav__button')`. When the click target is the inner
`<svg>`/`<path>`, the toggle and the outside-click handler can race (the button's
`onClick` opens it, then the document handler immediately closes it), or the icon
intercepts the event. The standard fix is `pointer-events: none` on the icon
(`Navigation/Icon.tsx` SVGs) so the click always registers on the button, or
reconciling the toggle vs. outside-click handling so the opening click isn't
treated as an outside click.

## Subtasks

- [ ] Reproduce: click precisely on the icon glyph vs. the button padding
- [ ] Confirm root cause (icon `pointer-events` vs. toggle/outside-click race)
- [ ] Apply the minimal fix (prefer `pointer-events: none` on the nav icons if
      that resolves it)
- [ ] Verify open/close still works for both the button and the icon, and
      outside-click dismissal is unaffected
- [ ] `npm test` green + 9 snapshots unchanged

## Notes

- Files: `src/components/Controls.tsx` (outside-click handler),
  `src/components/Navigation/NavigationHeader.tsx`,
  `src/components/Navigation/Icon.tsx`, `src/styles/_controls.scss`.
- Related: [[TASK-106]] (surfaced during QA).
