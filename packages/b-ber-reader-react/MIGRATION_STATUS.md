# Reader Migration Status

_Last updated: 2026-04-05 (pass 5 — spinner/navigation fixes)_

## Context

`src/components/Reader/index.jsx` was migrated from a class component to a
functional component (commit `69b394ec`). The migration used a `selfRef` /
`stateRef` / `propsRef` shim to let the external modules (`navigation.js`,
`loader.js`, `resize.js`) continue using `this.state` and `this.props` without
being rewritten. After the initial migration the app loaded correctly but
crashed on the first attempt to navigate between chapters.

---

## Bugs Fixed in This Pass

### 1 — `NavigationFooter`: `props.spine.length` crash

**File:** `src/components/Navigation/NavigationFooter.jsx`

**Problem:** `props.spine.length` in the `useMemo` dependency array threw
`TypeError: Cannot read properties of undefined (reading 'length')` when
`spine` was `undefined`. The git commit that was supposed to add
`props.spine?.length` did not produce the expected file change.

**Fix:**

- Extract `spineLength = props.spine?.length ?? 0` before the hook so the dep
  array never directly dereferences a potentially-undefined `spine`.
- Guard all `.length` accesses inside the memo factory with `p.spine?.length ?? 0`.
- Add `if (!props.spine) return null` after the hook (React rules require hooks
  before any conditional return) to prevent rendering with missing data.

---

### 2 — Initialization: no spinner during OPF fetch (C5)

**File:** `src/components/Reader/index.jsx` — initialization `useEffect`

**Problem:** `UNSAFE_componentWillMount` ran before the first render, so the
reader was technically never visible before the OPF fetch began. With the
`useEffect` migration the component renders a blank, interactive frame while
the network requests are in flight.

**Fix:** Dispatch `{ spinnerVisible: true, handleEvents: false }` at the very
start of the initialization effect, before `createStateFromOPF` is called.
The spinner is hidden by `Ultimate.jsx` after the layout stabilises (unchanged
behavior). This prevents user interaction during initial load and eliminates
the blank-frame window.

---

### 3 — Double `loadSpineItem` call on chapter navigation

**File:** `src/components/Reader/index.jsx` — `searchParams` `useEffect`

**Problem:** When `handleChapterNavigation` called `loadSpineItem`, that
function eventually called `updateQueryString`, which changed Redux
`readerLocation.searchParams`. The `searchParams` `useEffect` fired, saw
`prevSlug !== slug`, and called `loadSpineItem` a second time for the same
chapter. The original class component had the same pattern via
`UNSAFE_componentWillReceiveProps` — it was a latent bug, but it became more
visible in the functional component because the two load paths could interleave
more freely with the `pendingCallbacks` flush timing.

**Fix:** In the `searchParams` `useEffect`, when the slug changes, check
whether `stateRef.current.currentSpineItem?.slug` already equals the incoming
slug. `handleChapterNavigation` and `navigateToChapterByURL` both update
`currentSpineItem` in Reader state **before** calling `loadSpineItem`, so this
flag is always set when the change was triggered internally. External navigation
(browser back/forward, deep links) arrives with a slug that does not match the
current `currentSpineItem`, so those still trigger a load.

---

### 4 — `loadSpineItem` crashes when spine is empty, and freezes UI on error

**File:** `src/components/Reader/loader.js`

**Problems:**

- If `loadSpineItem` was called before `createStateFromOPF` populated the spine
  (possible in edge cases despite the new `handleEvents: false` guard),
  `this.state.spine[0]` would be `undefined` and `requestedSpineItem.absoluteURL`
  would throw.
- The `catch` block deleted localStorage and returned without re-enabling the
  UI. Because `freeze()` was called before the `try`, the spinner remained
  visible and events remained disabled indefinitely after a network failure
  (IMPROVEMENT_PLAN.md M2).

**Fix:**

- After the existing `if (!requestedSpineItem)` fallback, add a second guard
  that `console.warn`s and returns early if `requestedSpineItem` is still
  `undefined` (empty spine).
- In the `catch` block, dispatch
  `userInterfaceActions.update({ handleEvents: true, spinnerVisible: false })`
  to restore the UI after a failed load.

---

## Files Changed

| File                                             | Change                                                                                                                                                                                                                                          |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/Navigation/NavigationFooter.jsx` | Optional chaining on `spine`, early-return guard (pass 1)                                                                                                                                                                                       |
| `src/components/Reader/index.jsx`                | Show spinner on mount; double-load prevention in `searchParams` effect (pass 1)                                                                                                                                                                 |
| `src/components/Reader/loader.js`                | Empty-spine guard; UI re-enable in catch block (pass 1)                                                                                                                                                                                         |
| `src/components/Ultimate.jsx`                    | Replace RAF loop with ResizeObserver + debounce; convert class → functional; replace `UNSAFE_componentWillReceiveProps` with `useEffect` (pass 2)                                                                                               |
| `src/lib/with-last-spread-index.jsx`             | Replace `setInterval` with `ResizeObserver`; fix H1 division-by-zero; fix L2 spurious dispatch; remove debug `console.log`; remove unused `lastSpreadIndex` local state (pass 3); add `MutationObserver` to fix CSS columns blind spot (pass 4) |
| `src/components/Ultimate.jsx`                    | Remove `ResizeObserver` that caused timer to be continuously reset; keep self-rescheduling `setTimeout` only (pass 4)                                                                                                                           |
| `IMPROVEMENT_PLAN.md`                            | Check off Phase 2 `withLastSpreadIndex` item (pass 3)                                                                                                                                                                                           |

---

## Bugs Fixed in This Pass (Pass 2)

### 5 — `Ultimate.jsx`: RAF loop replaced with ResizeObserver + debounce

**File:** `src/components/Ultimate.jsx`

**Problem:** The original RAF loop (`poll()`) rescheduled itself on every
animation frame, called `setState` ~100 times per chapter load, and waited an
arbitrary 1.67s minimum before declaring layout stable (IMPROVEMENT_PLAN.md
C1). The class component also used `UNSAFE_componentWillReceiveProps` to
restart polling on chapter change.

**Fix:**

- Converted `Ultimate` from a class component to a functional component.
- Replaced the RAF loop with a `ResizeObserver` that watches both the sentinel
  `<span>` node and the `#frame` container. Each resize event resets a
  `STABILITY_DEBOUNCE_MS` (100ms) timer.
- A self-rescheduling `setTimeout` serves as a fallback: it compares the
  current `offsetLeft` to the last recorded reading. If unchanged, layout is
  declared stable and `onStable()` fires. If still changing, the timer
  reschedules itself. This catches column reflows that shift element _positions_
  without triggering a `ResizeObserver` event.
- `UNSAFE_componentWillReceiveProps` (restart on chapter change) is replaced by
  a `useEffect` that tracks the previous `view.loaded` value via `useRef` and
  calls `startWatching()` when it flips `true → false`.
- The Redux action dispatch in `onStable()` is identical to the original
  (`viewActions.load()`, `updateUltimateNodePosition`, `userInterfaceActions.update`),
  preserving the downstream consumer contract.

---

## Bugs Fixed in This Pass (Pass 3)

### 6 — `withLastSpreadIndex`: `setInterval` replaced with `ResizeObserver`

**File:** `src/lib/with-last-spread-index.jsx`

**Problems addressed:**

- **H2** — A `setInterval` at 1000ms ran indefinitely after mount, polling
  `scrollHeight` and logging `'update content dimensions'` to the console on
  every tick regardless of whether content had changed.
- **H1** — Division by zero: when `getFrameHeight()` returned `'auto'` (scroll
  layout), `frameHeight` was coerced to `0`, producing `Infinity` as
  `lastSpreadIndex`. Any navigation logic comparing spread indices to
  `lastSpreadIndex` would break in scroll mode.
- **L2** — Spurious dispatch on slug change: `setContentDimensions(0)` on slug
  change triggered the `contentDimensions` effect which dispatched
  `lastSpreadIndex = 0` mid-chapter-load. Since `freeze()` already dispatches
  `lastSpreadIndex = -1` when loading starts, this was redundant and potentially
  disruptive.
- **M5 (partial)** — Removed the `console.log('update content dimensions', ...)`
  statement that was present in the interval callback.

**Fix:**

- Replaced `setInterval` with a `ResizeObserver` watching `node.current` (the
  `#content` div, which contains all book HTML including the sentinel). The
  observer fires only when element size actually changes.
- An initial `measureContentDimensions()` call is made synchronously after the
  observer is set up to handle content already sized before any resize event.
- H1: Added an explicit guard — if `frameHeight` is `0` or non-numeric, dispatch
  `lastSpreadIndex = 0` directly (scroll layout has only one logical spread).
- L2: Skip the `updateLastSpreadIndex` dispatch when `contentDimensions === 0`.
- Removed the `lastSpreadIndex` local state variable — it was set but never read
  from local state (the rendered `lastSpreadIndex` always came from Redux props).
- Added `propsRef` (always-current ref) to avoid stale prop closures in the
  `contentDimensions` effect.

---

## Bugs Fixed in This Pass (Pass 4)

### 7 — `Ultimate.jsx`: ResizeObserver caused spinner to never hide on initial load (Bug 1)

**File:** `src/components/Ultimate.jsx`

**Problem:** Pass 2 introduced a `ResizeObserver` that observed both the
sentinel span and `#frame`. `#frame` has `position: absolute; top/left/right/ bottom: 0` — during initial page load (font resolution, layout recalculation
passes), the browser can resize `#frame` repeatedly. Each resize callback
called `scheduleStabilityCheck()`, which cleared and reset the 100ms debounce
timer. The timer never fired, so `onStable()` was never called and the spinner
was never hidden. A manual window resize stopped the layout cycles, let the
timer fire, and unblocked the spinner — which matched the observed symptom.

**Fix:** Removed `ResizeObserver` from `Ultimate` entirely. The self-rescheduling
`setTimeout` is sufficient: it polls `offsetLeft` at 100ms intervals, records the
value on each tick, and calls `onStable()` on the first tick where the value
matches the previous tick. No external event source is needed — the loop drives
itself until layout is stable.

---

### 8 — `withLastSpreadIndex.jsx`: ResizeObserver never fired for CSS columns content changes (Bug 2)

**File:** `src/lib/with-last-spread-index.jsx`

**Problem:** Pass 3 replaced `setInterval` with `ResizeObserver` on the `#content`
div. In a CSS `columns` layout, `#content`'s rendered border-box height is fixed
(equal to the column height H) — content overflows _horizontally_ into additional
columns, not vertically. `ResizeObserver` tracks border-box size, so it never
fired when new chapter content was committed to the DOM. As a result,
`contentDimensions` was never updated after the initial mount measurement, so
`lastSpreadIndex` was always wrong (0 or stale), causing the navigation controls
to show incorrect state and triggering unexpected chapter jumps / content flashes
on navigation.

**Fix:** Added a `MutationObserver` (with `childList: true, subtree: true`) on
`#content` alongside the existing `ResizeObserver`. The `MutationObserver` fires
when React commits new chapter DOM nodes — exactly the event that `ResizeObserver`
missed. Both observers share a single debounced `measureContentDimensions()`
callback (debounce: `MEASURE_DEBOUNCE_MS = 100ms`) that reads `scrollHeight`
(the total linear content height, which does grow with content regardless of the
columns context). The `ResizeObserver` is retained for window-resize detection,
where the border-box size (`minHeight`) genuinely changes.

---

---

## Bugs Fixed in This Pass (Pass 5)

### 9 — `Ultimate.jsx`: stability loop never terminates when offsetLeft keeps changing

**File:** `src/components/Ultimate.jsx`

**Problem:** The `scheduleCheck` setTimeout loop only called `onStable()` when
two consecutive `offsetLeft` readings were identical. If anything kept shifting
the sentinel's position (slow font loads, animated CSS, `Spread.jsx`'s
`setInterval` updating its multiplier during initial layout), the loop would
reschedule indefinitely, never calling `onStable()`. This kept
`userInterface.spinnerVisible = true` and `userInterface.handleEvents = false`
permanently — the spinner never hid, new chapter content was invisible behind
the spinner, and keyboard navigation was blocked.

**Fix:** Added `MAX_WAIT_MS = 3000` and a `startTimeRef` that records
`Date.now()` when `startWatching()` begins. In each `scheduleCheck` tick, if
`Date.now() - startTimeRef.current >= MAX_WAIT_MS`, `onStable()` is called
unconditionally. This guarantees the spinner always hides within 3 seconds at
the absolute worst case, even if layout never fully settles. Normal loads
(stable in 1–2 ticks) are unaffected.

---

### 10 — `resize.js` `handleResize`: dispatched zero dimensions on every resize

**File:** `src/components/Reader/resize.js`

**Problem:** `new ViewerSettings().get()` returns `{ width: 0, height: 0, ... }`
because `ViewerSettings.defaults.width = 0` and `ViewerSettings.defaults.height = 0`.
On every window resize event `handleResize` dispatched zeroed dimensions,
temporarily corrupting layout until `withDimensions.updateDimensions()` corrected
them on the next paint. This also caused `getFrameHeight()` to return a negative
value when called between the bad dispatch and the correction.

**Fix:** Explicitly set `viewerSettings.width = window.innerWidth` and
`viewerSettings.height = scrollingLayout ? 'auto' : window.innerHeight` before
calling `.get()`, matching the behaviour of `withDimensions.updateDimensions()`.

---

### 11 — Debug `console.log` statements (M5)

**Files:** `src/components/Reader/index.jsx`, `src/components/Reader/navigation.js`,
`src/components/Reader/loader.js`

**Problem:** Several debug log statements left over from the class-to-functional
migration were producing noise in the console on every chapter load and navigation.

**Fix:** Removed `'--- reader calls unload'`, `'this.props.userInterfaceActions.update'`,
`'--- ok show'` from `Reader/index.jsx`; `'handleChapterNavigation'` from
`navigation.js`; `'showSpineItem'` from `loader.js`.

---

## Files Changed (Pass 5)

| File                                  | Change                                                                                    |
| ------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/components/Ultimate.jsx`         | Add `MAX_WAIT_MS = 3000` fallback; track `startTimeRef`; force `onStable()` after timeout |
| `src/components/Reader/resize.js`     | Fix `handleResize` to set `width`/`height` from `window.inner*` before `.get()`           |
| `src/components/Reader/index.jsx`     | Remove debug `console.log` statements (M5)                                                |
| `src/components/Reader/navigation.js` | Remove `console.log('handleChapterNavigation')` (M5)                                      |
| `src/components/Reader/loader.js`     | Remove `console.log('showSpineItem')` (M5)                                                |

---

## Known Remaining Issues

These were pre-existing and are documented in `IMPROVEMENT_PLAN.md`. They were
not introduced by the functional-component migration and are not addressed in
this pass:

- `book.content` mutation bypasses React rendering (C4)
- Per-`Spread` `setInterval` polling (H3)
- `bindResizeHandlers` / `unbindResizeHandlers` names are inverted (H4)
- The `selfRef` / `stateRef` indirection in `Reader/index.jsx` is a temporary
  migration pattern. In a later phase the external modules (`navigation.js`,
  `loader.js`, `resize.js`) should be converted to custom hooks and the shim
  removed (IMPROVEMENT_PLAN.md Option A Phase 3 / Option C).

---

## Next Steps

1. **Verify spinner fix** — load the app, confirm the spinner hides automatically
   without any window resize required. Worst case: 3s (MAX_WAIT_MS), typical: ~200ms.
2. **Verify chapter navigation** — navigate forward/backward between chapters,
   confirm spinner shows then hides cleanly and new chapter content renders.
3. **Verify keyboard navigation** — press arrow keys, confirm pages and chapters
   advance correctly (was blocked by `handleEvents: false`).
4. **Verify `lastSpreadIndex` correctness** — in a multi-spread chapter, confirm
   the "last page" control is enabled only on the actual last spread.
5. **Verify scroll layout** — confirm `lastSpreadIndex = 0` in scroll/mobile mode
   and that navigation still works correctly.
6. **Verify backward chapter navigation** — navigate backward, confirm landing
   on the last spread of the previous chapter.
7. **Replace per-`Spread` `setInterval`** with a `ResizeObserver` — the last
   remaining Phase 2 item (IMPROVEMENT_PLAN.md Phase 2).
8. **Fix the `bindResizeHandlers` / `unbindResizeHandlers` naming** (H4) —
   low risk, high clarity improvement.
9. **Convert external modules to hooks** — extract `navigation.js`,
   `loader.js`, `resize.js` into custom hooks and remove the `selfRef` shim
   (IMPROVEMENT_PLAN.md Option A Phase 3).
