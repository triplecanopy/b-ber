# Bug Status

_Last updated: 2026-04-06 (pass 10 — full-bleed spreads: fix spreadContextValue sub-pixel float)_

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

---

## Bug 2 — Full-bleed "spreads" are out of sync with visible page

**Status:** Fixed in `src/components/Spread.jsx` (pass 9 + pass 10 — complete fix)

### Root cause analysis

Each `Spread` component classifies itself as **verso** (left-hand page, `multiplier = 2`)
or **recto** (right-hand page, `multiplier = 3`) by computing:

```
offset = (offsetLeft - paddingLeft) / pageWidth
```

where `pageWidth = window.innerWidth - paddingLeft - paddingRight + columnGap`.

`offset` is 0 or a whole integer on a verso spread; a non-integer (e.g. 0.5) on a recto
spread. For a single full-bleed chapter at 1425×1046 (DESKTOP_MD), the only `Spread`
should be verso (`offset = 0`, `multiplier = 2`, `height = 1200`).

**The race condition — stale closure in the ResizeObserver callback:**

On a cross-breakpoint window resize (e.g. DESKTOP_LG → DESKTOP_MD), two things happen
simultaneously:
1. Redux dispatches new `viewerSettings` with new `paddingLeft`/`columnGap` values.
2. The Spread's height changes because `paddingTop`/`paddingBottom` change
   (→ `frameHeight` changes → `(windowHeight - paddingTop - paddingBottom) * multiplier`
   is a different number).

The sequence that triggers the bug:
1. React **renders** `Spread` with new `paddingLeft` (e.g. `172.5` at DESKTOP_MD).
   The closed-over `props.viewerSettings` in the effect is now **outdated** — the effect
   hasn't re-run yet.
2. React **commits** the DOM: the Spread div's height changes from `1350` to `1200`.
3. The **old** `ResizeObserver` fires (it sees the height change) **before** React has run
   the old effect's cleanup (`disconnect + replace`). This is the race window.
4. Inside `updatePosition`, `node.current.offsetLeft` is `172.5` (the correct NEW layout),
   but the closure reads `props.viewerSettings.paddingLeft = 80` (the OLD stale value from
   DESKTOP_LG). Therefore:
   ```
   offset = (172.5 - 80) / old_pageWidth ≈ 0.065
   ```
   A non-integer → **recto misclassification** → `multiplier = 3` → `height = 1800`.
5. `withLastSpreadIndex` measures `scrollHeight = 1800` →
   `lastSpreadIndex = ceil(1800/600/2) - 1 = 1` — two pages instead of one.
6. `SpreadContext.left` is computed with the recto formula (`left + innerWidth/2 - paddingLeft + columnGap/2 - paddingLeft`), giving a large non-zero value. `SpreadFigure` uses this to position the image off-center, causing it to appear as a sliver on the wrong page.
7. The new `useEffect` eventually runs and corrects `multiplier` back to `2`, but
   **`withLastSpreadIndex` never re-measures**: its `MutationObserver` only watches child
   list changes (not style changes) and its `ResizeObserver` only tracks `#content`'s
   border-box height (which is fixed at column height regardless of Spread height).
   `lastSpreadIndex = 1` persists until the next chapter load.

**Why the first fix attempt (pass 8) was insufficient:**

Pass 8 replaced `setInterval` with `ResizeObserver` on the Spread node. This eliminated the
`setInterval` stale-closure window, but the **ResizeObserver callback still closed over the
old `props.viewerSettings`** from when the effect was set up. The race condition remained
identical: the old ResizeObserver callback could fire before the old effect cleanup, with the
old `paddingLeft` in scope.

### Fix applied (pass 9)

**`src/components/Spread.jsx`**

Added `viewerSettingsRef` — an always-current ref for `viewerSettings` that is updated on
**every render** (outside any hooks, so it runs during the render phase before any effects).

```js
const viewerSettingsRef = useRef(props.viewerSettings)
viewerSettingsRef.current = props.viewerSettings   // updated during render
```

`updatePosition` now reads from `viewerSettingsRef.current` instead of the closed-over
`props.viewerSettings`:

```js
const { paddingLeft, paddingRight, columnGap } = viewerSettingsRef.current
```

This eliminates the race: by the time any callback fires (step 3 above), `viewerSettingsRef.current` was already updated in step 1 to the new `paddingLeft`. The old ResizeObserver sees the correct current value, computes `offset = 0`, and correctly classifies the Spread as verso.

The dep array `[paddingLeft, paddingRight, columnGap]` is kept so the effect re-runs when
these values change — this covers the case where Spread height does **not** change (a pure
horizontal resize within the same breakpoint, where the ResizeObserver never fires).

### Pass 9 — fix (incomplete, addressed resize race only)

Added `viewerSettingsRef` so the ResizeObserver callback always reads current `paddingLeft`. This fixed the stale-closure race on cross-breakpoint resize but did NOT fix the initial-load sub-pixel misclassification.

### Pass 10 — root cause and complete fix

**Second root cause (initial load, no resize required):**

`paddingLeft = (window.innerWidth - maxWidth) / 2` is a fractional number when `(innerWidth - maxWidth)` is odd (e.g. 1425px → `(1425-1080)/2 = 172.5`). Chrome's CSS columns engine snaps column positions to whole-pixel boundaries, so `offsetLeft = 172` (integer). The raw offset:

```
offset = (172 - 172.5) / 1145 = -0.000436
```

This is non-zero and non-integer → recto misclassification → `multiplier = 3` → `height = 1800` → `lastSpreadIndex = 1` → two pages. This happens at every window width where `(innerWidth - maxWidth)` is odd — no resize required.

**Two fixes applied in `updatePosition`:**

```js
const pageWidth = window.innerWidth - paddingLeft - paddingRight + columnGap
const rawOffset = (nextLeft - paddingLeft) / pageWidth
// Round to nearest 0.5 (valid positions are 0, 0.5, 1, 1.5, …)
const nextOffset = Math.round(rawOffset * 2) / 2
```

**Fix in `spreadContextValue`:**

The original formula `nextLeft = left + (verso ? 0 : innerWidth/2 - paddingLeft + columnGap/2) - paddingLeft` also suffered from the sub-pixel issue. `left = offsetLeft - paddingLeft = -0.5px`, so `Math.floor(-0.5) = -1` inside `SpreadFigure`, causing the figure to be placed off-screen.

Replaced with a formula derived from `offset` (the already-rounded column index):

```js
const pageWidth = window.innerWidth - paddingLeft - paddingRight + columnGap
nextLeft = verso
  ? Math.round(offset) * pageWidth   // column 0 → 0, column 2 → pageWidth
  : (Math.floor(offset) + 1) * pageWidth  // column 1 → pageWidth, column 3 → 2*pageWidth
```

This avoids all `offsetLeft - paddingLeft` arithmetic, giving exact integer results regardless of window width. Deps updated: `left` → `offset`, added `paddingRight`.

### Files changed

| File                        | Change                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `src/components/Spread.jsx` | (pass 9) Add `viewerSettingsRef`; read from ref in `updatePosition`                                                       |
| `src/components/Spread.jsx` | (pass 10) Round `rawOffset` to nearest 0.5 in `updatePosition`; replace `offsetLeft`-based `nextLeft` with `offset × pageWidth` formula in `spreadContextValue`; update deps |

### Testing notes

1. **Single full-bleed spread at DESKTOP_MD boundary** — set browser width to 1425px and
   height to 1046px. Load a chapter with exactly one full-bleed spread. Confirm it renders
   as **one page** (no second empty page) and the image fills the viewport.

2. **Image on correct spread** — with the same chapter, confirm the full-bleed image is
   visible and full-bleed on `spreadIndex = 0`. The forward navigation button should be
   disabled (no second page).

3. **Resize from DESKTOP_LG to DESKTOP_MD** — load the app at a width ≥ 1440px, then drag
   to a width between 1140px and 1440px. Confirm: (a) the chapter still shows as one page,
   (b) the image remains full-bleed after the resize, and (c) `lastSpreadIndex` does not
   transiently become `1`.

4. **Resize in the opposite direction** — repeat step 3 starting narrow (DESKTOP_MD) and
   widening past 1440px (DESKTOP_LG). Confirm the same correct behaviour.

5. **Resize within a single breakpoint** — within DESKTOP_MD (1140–1440px), resize
   horizontally by several hundred pixels. Confirm the image stays full-bleed and the page
   count stays at one.

6. **Multi-spread chapters** — in a chapter with multiple spreads (verso + recto), confirm
   each is classified correctly. The recto spread's spacer should be 3× frame height; the
   verso spread 2×. The figure on each spread should be full-bleed at the correct
   `spreadIndex`.

7. **Scroll layout** — confirm the full-bleed mechanism does not break scroll/mobile layout
   (`isScrolling = true` → `SpreadContext.left = 0` for all spreads).
