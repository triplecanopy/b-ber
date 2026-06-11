# TASK-063: withLastSpreadIndex — setInterval → ResizeObserver + MutationObserver

**Status:** complete
**Phase:** Modernization — Phase 2
**Created:** 2026-04-05
**GitHub Issue:** #464 — https://github.com/triplecanopy/b-ber/issues/464

## Description

Replace the `setInterval` polling in `withLastSpreadIndex.jsx` with event-driven
observers. This addresses IMPROVEMENT_PLAN items H1, H2, and L2.

## Subtasks

- [x] Replace 1000ms `setInterval` with `ResizeObserver` on `#content` (pass 3)
- [x] Fix division-by-zero: when `frameHeight === 0` (scroll layout), dispatch `lastSpreadIndex = 0` (pass 3)
- [x] Fix spurious dispatch: skip `updateLastSpreadIndex` when `contentDimensions === 0` (pass 3)
- [x] Remove `console.log('update content dimensions')` (pass 3)
- [x] Add `MutationObserver` (childList + subtree) because CSS columns overflow horizontally — ResizeObserver never fires for content changes (pass 4)
- [x] Remove unused `lastSpreadIndex` local state variable (pass 3)
- [x] Add `propsRef` to avoid stale prop closures (pass 3)

## Notes

- ResizeObserver on `#content` only fires when border-box height changes; in a CSS
  columns layout, content overflows horizontally, so the height is fixed. The
  MutationObserver catches DOM commits that ResizeObserver misses.
- Both observers share a single debounced `measureContentDimensions()` callback
  (debounce: 100ms).
- Files changed: `src/lib/with-last-spread-index.jsx`.
