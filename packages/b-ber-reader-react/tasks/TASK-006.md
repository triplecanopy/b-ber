# TASK-006: Bug fix — loader never hides (Bug 1)

**Status:** complete
**Phase:** Bug Fixes
**Created:** 2026-04-06
**GitHub Issue:** #466 — https://github.com/triplecanopy/b-ber/issues/466

## Description

Fix the root cause of the spinner never hiding on initial load or after chapter
navigation. The bug required manual browser resize to trigger a reflow that forced
the spinner to hide.

## Root Cause

`book.content` is a module-level mutable variable. React doesn't track mutations to
it. `BookContent` (which renders `book.content`) only re-renders when its parent
`Layout` re-renders. Because every prop passed to `Frame` was identical across the
load sequence, `Frame` bailed out of re-rendering — `Layout` never re-rendered,
`BookContent` never re-rendered with new content, `Ultimate` was never mounted, and
`startWatching()` was never called.

## Fix

Thread `spineItemURL` from Reader → Frame → withLastSpreadIndex → Layout and use
it as the `key` for `<props.BookContent />`. The key change forces `BookContent` to
unmount and remount, reading the new content. A fresh `BookContent` mounts `Ultimate`,
which runs the stability loop and hides the spinner.

## Subtasks

- [x] Pass `spineItemURL` prop from `Reader/index.jsx` to `Frame`
- [x] Pass `spineItemURL` through `Frame.jsx` to `Layout`
- [x] Add `spineItemURL` to explicit prop list in `with-last-spread-index.jsx`
- [x] Use `spineItemURL` as the `key` for `<props.BookContent />` in `Layout.jsx`

## Notes

- `withDimensions` uses `{...this.props}` spread so `spineItemURL` passes through automatically.
- This also fixes the chapter navigation content refresh issue (BookContent remounts on every chapter change).
- Files changed: `Reader/index.jsx`, `Frame.jsx`, `with-last-spread-index.jsx`, `Layout.jsx`.
