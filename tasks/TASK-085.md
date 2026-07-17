# TASK-085: Fix infinite spinner on window resize

**Status:** complete
**Feature:** React 19 (reader-react)
**Phase:** Bug Fixes
**Priority:** high
**Created:** 2026-06-06

## Description

Resizing the window leaves the spinner spinning forever; the reader UI never
comes back. Reproduced immediately with the default `i29-roundup` project.

### Root cause

On resize, `handleResizeStart` (resize.js) calls `freeze()`, which shows the
spinner and disables event handling. The spinner is normally hidden again by
`Ultimate`'s `onStable()` once the layout settles. But `Ultimate` only restarts
its stability watch on (a) mount, or (b) `view.loaded` flipping `true → false`.
A resize does **neither**: the chapter does not remount (no slug change), and
`freeze()` deliberately no longer dispatches `unload()` (it was removed to avoid
restarting the *old* chapter's `Ultimate` during navigation — see TASK-086 /
BUG 5). So nothing re-arms the watch → `onStable()` never fires again → the
spinner shown by `freeze()` stays up forever.

This is the resize-path consequence of BUG 5. The original class component
avoided it because the old `freeze()` *did* call `unload()`; the refactor removed
it globally and only re-covered the chapter-change case (via remount).

### Fix implemented

`handleResizeStart` now dispatches `viewActions.unload()` right after `freeze()`.
Because a resize keeps the same `Ultimate` instance mounted, flipping
`view.loaded` `true → false` triggers `Ultimate`'s `loaded` effect →
`startWatching()` → the watch re-arms and `onStable()` hides the spinner once the
post-resize layout settles. The chapter-change path is untouched (still relies on
remount), so the original premature-hide bug is not reintroduced. Removed the
now-redundant commented-out scaffolding in the `setState` callback.

## Subtasks

- [x] Diagnose why the spinner never hides after resize
- [x] Re-arm `Ultimate`'s watch on resize via `unload()` in `handleResizeStart`
- [x] Confirm chapter navigation is unaffected
- [x] `npm test` passes
- [x] Verify in browser: resize repeatedly (and via fullscreen toggle); spinner
      hides and the reader returns to the correct spread each time
      (QA verified by user 2026-06-13; see SPREAD-CLUSTER-QA.md)
- [x] Commit and update `PLAN.md`; remove `.open`

## Notes

- This is a targeted fix. The deeper, more robust solution is TASK-086 (give the
  reader a single, well-defined "chapter loading" signal independent of the
  per-`Ultimate` watch), which would make the resize and chapter-change paths
  share one mechanism.
- Files changed: `src/components/Reader/resize.js`.
