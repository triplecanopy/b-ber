# TASK-008: Fix remaining open bugs — chapters re-render, keyboard navigation

**Status:** not started
**Phase:** Bug Fixes
**Priority:** high

## Description

Two bugs from the original audit remain open. Both appear to be regressions from
the Reader class-to-functional migration (TASK-001).

## Bug A — Chapters do not change on navigation, they re-render

**Current behaviour:** When navigating to a new chapter, the previous chapter
flashes and appears to reload. The URL slug updates to the new chapter but the new
content does not display. Resizing the browser window forces the correct content
to appear.

**Expected behaviour:** Click next/previous → spinner shows → new chapter content
loads → spinner hides with new chapter visible.

**Likely cause:** May be partially addressed by the `spineItemURL` key fix in
TASK-006. Needs verification. If still present, investigate whether
`handleChapterNavigation` is correctly updating `currentSpineItem` in `stateRef`
before `loadSpineItem` is called, and whether the `searchParams` useEffect is
incorrectly suppressing the load.

## Bug B — Keyboard prev/next navigation not working

**Current behaviour:** After the app loads, pressing left/right arrow keys hides
the navigation buttons in the UI and nothing else happens.

**Expected behaviour:** Arrow keys navigate forward/backward through pages and
chapters, matching the click behaviour of the navigation buttons.

**Likely cause:** `handleEvents` is `false` at the time the keydown handler fires.
Check whether the keydown listeners are being registered before or after
`onStable()` dispatches `handleEvents: true`. Also verify that `resize.js`
`unbindResizeHandlers` (which adds event listeners) is being called correctly from
the functional component.

## Subtasks

- [ ] Verify whether Bug A is resolved by the TASK-006 spineItemURL fix
- [ ] If Bug A persists: trace `handleChapterNavigation` → `loadSpineItem` → `searchParams` effect interactions
- [ ] Reproduce Bug B in the dev environment
- [ ] Trace keydown handler registration: confirm listeners are added after `onStable()` fires
- [ ] Verify `unbindResizeHandlers` call in `componentDidMount` equivalent effect
- [ ] Fix Bug A (if not already resolved)
- [ ] Fix Bug B
- [ ] Update `PLAN.md`

## Notes

- From IMPROVEMENT_PLAN.md H4: `bindResizeHandlers` and `unbindResizeHandlers` have
  inverted names. Fix in TASK-009 will clarify the call sites.
- Testing: arrow key navigation after initial load; chapter forward/back via buttons
  and keyboard; confirm spinner shows/hides on each chapter change.
