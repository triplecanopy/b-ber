# TASK-061: Post-migration bug fixes — pass 1

**Status:** complete
**Phase:** Bug Fixes
**Created:** 2026-04-04
**GitHub Issue:** #462 — https://github.com/triplecanopy/b-ber/issues/462

## Description

Fix regressions introduced by the Reader class-to-functional migration (TASK-060).
The app loaded correctly but crashed on the first chapter navigation attempt.

## Subtasks

- [x] Fix `NavigationFooter` crash: `props.spine.length` threw when `spine` was `undefined`
- [x] Fix double `loadSpineItem` call: `searchParams` useEffect fired a second load for the same chapter
- [x] Fix empty-spine guard in `loadSpineItem`: `requestedSpineItem` could be `undefined`
- [x] Fix `loadSpineItem` error handler: catch block left spinner visible and UI locked on network failure
- [x] Show spinner on initial mount before OPF fetch (IMPROVEMENT_PLAN C5)

## Notes

- `NavigationFooter` fix: extract `spineLength = props.spine?.length ?? 0`; add `if (!props.spine) return null`.
- Double-load prevention: check whether `stateRef.current.currentSpineItem?.slug` already equals the incoming slug before triggering a load.
- Error handler fix: dispatch `{ handleEvents: true, spinnerVisible: false }` in the `catch` block.
- Files changed: `NavigationFooter.jsx`, `Reader/index.jsx`, `Reader/loader.js`.
