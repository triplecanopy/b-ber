# Bug Status

_Last updated: 2026-04-05 (pass 7 — loader never hides, correct root cause)_

---

## Bug 1 — The loader never hides

**Status:** Fixed across 4 files (pass 7)

### Root cause analysis

The previous pass (pass 6) fixed three code paths in `Ultimate.jsx` that could silently abort
the stability-detection cycle. Those fixes were necessary but not sufficient. The spinner still
never hid because `Ultimate` was never mounted in the first place.

**Why `Ultimate` never mounted**

`book.content` is a module-level mutable variable in `loader.js`. React does not track
mutations to it. `BookContent` (the component that renders `book.content`) only re-renders
when its parent (`Layout`) re-renders.

The sequence in `loadSpineItem`:

```
book.content = bookContent          // (A) mutable write — React doesn't know
this.setState({ spineItemURL })     // (B) schedules a re-render of Reader
```

When (B) fires and Reader re-renders, it passes props to `Frame`:

```jsx
<Frame
  slug={slug}               // unchanged (set before loadSpineItem was called)
  spreadIndex={spreadIndex} // unchanged (always 0 at chapter start)
  lastSpreadIndex={view.lastSpreadIndex}  // unchanged (still -1 from freeze())
  view={view}               // unchanged (same Redux reference)
  ...
/>
```

`Frame` is a `connect()` HOC that uses shallow-equality on own props. Since every
prop value was identical to the previous render, `Frame` bailed out of re-rendering.
`Layout` never re-rendered. `BookContent` never re-rendered with the new `book.content`.
`Ultimate` was never mounted. `startWatching()` was never called. The spinner never hid.

**Why window-resize fixed it**

A resize event triggered `viewerSettings` to update. `withDimensions` is connected to
`viewerSettings` and re-renders on any change. This propagated down through `Layout` to
`BookContent`, which then read the already-set `book.content` and rendered it — including
`Ultimate`, which then ran the stability loop and hid the spinner.

### Fix applied (pass 7)

Thread `spineItemURL` from Reader → Frame → withLastSpreadIndex → Layout, and use it
as the `key` for `<props.BookContent />` in `Layout`.

`spineItemURL` is written in `this.setState({ spineItemURL })` **after**
`book.content = bookContent`, so the re-render triggered by that setState arrives with
`book.content` already populated. The key change forces `BookContent` to unmount and
remount, reading the new content. The fresh `BookContent` renders the chapter HTML
including the `<Ultimate>` sentinel. `Ultimate` mounts, calls `startWatching()`, and the
stability loop runs normally. Once `offsetLeft` is stable, `onStable()` dispatches
`{ spinnerVisible: false, handleEvents: true }` and the spinner hides.

This also fixes chapter navigation (Bug 2): whenever `spineItemURL` changes (new chapter),
`BookContent` remounts, reads the new chapter's content, and `Ultimate` restarts the
stability loop for the new chapter.

### Files changed

| File                                 | Change                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------ |
| `src/components/Reader/index.jsx`    | Destructure `spineItemURL` from `state`; pass `spineItemURL={spineItemURL}` to `<Frame>`   |
| `src/components/Frame.jsx`           | Pass `spineItemURL={props.spineItemURL}` to `<Layout>`                                     |
| `src/lib/with-last-spread-index.jsx` | Add `spineItemURL={props.spineItemURL}` to explicit prop list passed to `WrappedComponent` |
| `src/components/Layout.jsx`          | Change `<props.BookContent />` to `<props.BookContent key={props.spineItemURL} />`         |

Note: `withDimensions` uses `{...this.props}` spread so `spineItemURL` passes through it
automatically — no change needed there.

### Why the pass-6 Ultimate.jsx fixes are still required

The three `Ultimate.jsx` fixes from pass 6 are still necessary. They guard against
`onStable()` failing to dispatch even when `Ultimate` IS mounted (e.g. if the sentinel
node is transiently absent during a remount in StrictMode, or when `offsetLeft` changes
indefinitely due to slow font loads). The pass-7 fix ensures `Ultimate` gets mounted at
all; the pass-6 fixes ensure `onStable()` always fires once it is.

### Testing notes

1. **Initial load (cold start)** — load the app with no localStorage. Confirm the spinner
   appears then hides automatically within ~200ms (stable offsetLeft) or at most ~1500ms
   (MAX_WAIT_MS fallback). No manual resize should be required.

2. **Initial load (warm start)** — reload with localStorage present. Confirm spinner shows
   then hides on the saved chapter without a resize.

3. **Chapter navigation forward** — navigate to the next chapter. Confirm: spinner shows
   when navigation starts, new chapter content appears when the spinner hides, navigation
   controls remain functional.

4. **Chapter navigation backward** — navigate to the previous chapter. Confirm landing on
   the last spread of that chapter (chapterDelta < 0 path in Reader's view.loaded effect).

5. **Keyboard navigation (Bug 3)** — after the initial-load spinner hides, press left/right
   arrow keys. Confirm pages and chapters advance/retreat correctly.

6. **Multiple chapter navigations** — navigate forward several chapters then back. Confirm
   spinner shows/hides correctly on every transition and no stale chapter content is shown.

7. **Scroll layout** — confirm `lastSpreadIndex = 0` in scroll/mobile layout and spinner
   still hides correctly.
