# TASK-005: Pass 5 — resize fix, stability timeout, console.log cleanup

**Status:** complete
**Phase:** Bug Fixes
**Created:** 2026-04-05
**GitHub Issue:** #465 — https://github.com/triplecanopy/b-ber/issues/465

## Description

Fix three issues surfaced during integration testing after the observer migrations.

## Subtasks

- [x] Fix `resize.js` handleResize: `new ViewerSettings().get()` returned `{ width: 0, height: 0 }` on every resize, dispatching zeroed dimensions that corrupted layout until `withDimensions` corrected them
- [x] Fix Ultimate.jsx stability loop: if `offsetLeft` kept changing indefinitely the loop would never call `onStable()` — add `MAX_WAIT_MS = 3000` hard timeout
- [x] Remove remaining debug `console.log` statements from `Reader/index.jsx`, `navigation.js`, `loader.js` (IMPROVEMENT_PLAN M5)

## Notes

- Resize fix: explicitly set `viewerSettings.width = window.innerWidth` and `viewerSettings.height = scrollingLayout ? 'auto' : window.innerHeight` before calling `.get()`.
- Files changed: `Ultimate.jsx`, `Reader/resize.js`, `Reader/index.jsx`, `Reader/navigation.js`, `Reader/loader.js`.
