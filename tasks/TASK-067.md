# TASK-067: Fix remaining open bugs — chapters re-render, keyboard navigation

**Status:** complete
**Phase:** Bug Fixes
**Priority:** high
**GitHub Issue:** #468 — https://github.com/triplecanopy/b-ber/issues/468

## Description

Two bugs from the original audit remain open. Both appear to be regressions from
the Reader class-to-functional migration (TASK-060).

## Bug A — Chapters do not change on navigation, they re-render

**Current behaviour:** When navigating to a new chapter, the previous chapter
flashes and appears to reload. The URL slug updates to the new chapter but the new
content does not display. Resizing the browser window forces the correct content
to appear.

**Expected behaviour:** Click next/previous → spinner shows → new chapter content
loads → spinner hides with new chapter visible.

**Root cause (identified):** `freeze()` in Reader called `viewActions.unload()`,
which set `view.loaded = false`. This triggered the OLD chapter's `Ultimate`
instance to restart its stability watch. Since the old layout is stable, OLD
Ultimate fired `onStable()` ~200ms into the network fetch — hiding the spinner
before the new chapter loaded. Users saw old content without a spinner during
slow fetches. When the new chapter finally loaded, `BookContent` remounted (via
the `spineItemURL` key from TASK-065) and showed correct content.

**Fix:** Removed `viewActions.unload()` from `freeze()`. The `handleEvents:false` /
`spinnerVisible:true` state is set directly via `userInterfaceActions.update`.
NEW Ultimate (mounting when `BookContent` remounts after the fetch) runs its own
stability cycle and calls `onStable()` at the correct time.

Also changed `Frame`'s scroll-to-top effect dependency from `[view.loaded]` to
`[props.slug]` — `view.loaded` no longer cycles during chapter navigation, so the
slug (which changes on every chapter) is the correct trigger.

## Bug B — Keyboard prev/next navigation not working

**Current behaviour:** After the app loads, pressing left/right arrow keys hides
the navigation buttons in the UI and nothing else happens.

**Expected behaviour:** Arrow keys navigate forward/backward through pages and
chapters, matching the click behaviour of the navigation buttons.

**Root cause (identified):** `Controls.jsx`'s `handleKeyDown` called
`props.viewActions.unload()` before every arrow-key press. This triggered OLD
Ultimate to restart its stability watch unnecessarily. For chapter-boundary
navigation, OLD Ultimate fired `onStable()` ~200ms into the fetch, prematurely
re-enabling events and hiding the spinner while the chapter was still loading.
Button click handlers (in `withNavigationActions`) did NOT call `viewActions.unload()`,
so the asymmetry caused keyboard navigation to behave differently from clicks.

**Fix:** Removed `props.viewActions.unload()` from the arrow-key cases in
`handleKeyDown`. Also removed the now-unused `viewActions` from Controls' `connect`
mapping and the `import * as viewActions` line.

## Subtasks

- [x] Verify whether Bug A is resolved by the TASK-065 spineItemURL fix
- [x] If Bug A persists: trace `handleChapterNavigation` → `loadSpineItem` → `searchParams` effect interactions
- [x] Reproduce Bug B in the dev environment
- [x] Trace keydown handler registration: confirm listeners are added after `onStable()` fires
- [x] Verify `unbindResizeHandlers` call in `componentDidMount` equivalent effect
- [x] Fix Bug A (if not already resolved)
- [x] Fix Bug B
- [x] Update `PLAN.md`

## Notes

- Bug A root cause was `viewActions.unload()` in `freeze()` causing OLD Ultimate to
  fire prematurely. The TASK-065 `spineItemURL` key fix ensured correct content eventually
  loaded, but the premature `onStable()` still hid the spinner too early.
- Bug B root cause was the same mechanism triggered via keyboard: `handleKeyDown`
  called `viewActions.unload()` before `handlePageNavigation`, triggering OLD Ultimate.
- Both bugs share the same fix: stop calling `viewActions.unload()` to signal loading
  state. Spinner and handleEvents are managed by `userInterfaceActions` directly; the
  NEW Ultimate handles stability detection for new chapter content.
- Frame's scroll-to-top (`scrollTo(0, 0)`) was gated on `[view.loaded]` changes. Since
  `view.loaded` no longer cycles during chapter navigation, changed to `[props.slug]`.
- From IMPROVEMENT_PLAN.md H4: `bindResizeHandlers` and `unbindResizeHandlers` have
  inverted names. Fix in TASK-068 will clarify the call sites.
