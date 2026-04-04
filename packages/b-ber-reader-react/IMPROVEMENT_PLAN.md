# b-ber Reader React — Improvement Plan

_Generated: 2026-04-04_

---

## Table of Contents

1. [Codebase Summary](#1-codebase-summary)
2. [Bug Analysis](#2-bug-analysis)
3. [Path to Modernization](#3-path-to-modernization)
4. [Timeline](#4-timeline)

---

## 1. Codebase Summary

The b-ber reader is a side-scrolling EPUB viewer built in React + Redux. It renders EPUB content (parsed from OPF/NCX manifests) into a CSS `columns`-based layout, using a translateX transform to simulate page-turning. A secondary "scroll" layout mode exists for mobile/single-column reading.

**Key architecture facts:**

- Entry: `src/index.jsx` → `App.jsx` → `Reader/index.jsx` (class component)
- Layout engine: `Layout.jsx` (functional) wrapped by two HOCs: `withDimensions` and `withLastSpreadIndex`
- Content is parsed from HTML into React elements via `html-to-react` and injected into a module-level `book` object
- State split between Redux (location, UI, viewer settings) and Reader class component local state (spine, navigation, chapter index)
- A sentinel element (`Ultimate.jsx`) polls the DOM via `requestAnimationFrame` to detect when layout has stabilized, then unlocks the UI

---

## 2. Bug Analysis

Bugs are ordered **Critical → High → Medium → Low**. Each entry includes a description, the root cause, and where a fix is obvious, a proposed solution.

---

### Critical

#### C1 — `Ultimate.jsx`: RAF loop runs at 60fps with `setState` on every frame

**File:** `src/components/Ultimate.jsx:37–53`

**Description:** The `poll()` method immediately reschedules itself via `requestAnimationFrame` on every call, then calls `this.setState({ prevLefts })` on every frame until 100 consecutive stable readings are accumulated (~1.67 seconds at 60fps). This means:

- ~100 synchronous `setState` calls at 60fps during every chapter load
- The component re-renders on every animation frame while the spinner is showing
- The threshold of 100 frames is an arbitrary magic number with no justification

**Root cause:** The algorithm was designed to detect layout stability by watching `offsetLeft`, but the implementation schedules the next frame _before_ doing the stability check, creating a tight loop regardless of whether anything has changed.

**Proposed fix:** Replace the RAF polling with a `ResizeObserver` on the sentinel element and wait for two consecutive observations with the same `offsetLeft`. This is event-driven, not polling-driven. If `ResizeObserver` isn't sufficient (e.g. columns re-flow without a resize event), use a short `setTimeout` (e.g. 100ms) after the content renders to verify stability once, rather than polling for 100 frames.

---

#### C2 — `UNSAFE_componentWillMount` triggers async network requests

**Files:** `src/components/Reader/index.jsx:128`, `src/components/App.jsx:11`

**Description:** Both `App` and `Reader` use `UNSAFE_componentWillMount` to kick off async work (loading books from an API, loading the OPF manifest). In React 18 Strict Mode, `UNSAFE_componentWillMount` fires _twice_ in development, which will double the network requests. More critically, the React team has indicated that this lifecycle may be removed in a future major version. The async nature of the work inside (network fetches) means errors cannot be properly caught at the component boundary.

**Proposed fix:** Move initialization into `componentDidMount` (for class components) or `useEffect` (for functional components). Gate network calls with a ref flag (`hasInitialized`) to prevent double-firing in Strict Mode.

---

#### C3 — `UNSAFE_componentWillReceiveProps` drives critical navigation logic

**Files:** `src/components/Reader/index.jsx:168–249`, `src/components/Ultimate.jsx:27–31`

**Description:** Both `Reader` and `Ultimate` use `UNSAFE_componentWillReceiveProps` for important state transitions:

- In `Reader`: detecting query string changes to trigger chapter/spread transitions (lines 183–217), and detecting when a chapter loaded backwards to navigate to the last spread (lines 225–238)
- In `Ultimate`: restarting the poll when `view.loaded` flips from `true` to `false` (line 28)

This lifecycle is fundamentally unreliable in concurrent React (React 18+) because props updates can be interrupted and replayed. The backwards-chapter navigation logic in particular (`chapterDelta < 0` check) depends on this lifecycle firing exactly once after `lastSpreadIndex` is available — a timing assumption that is not guaranteed.

**Proposed fix:** Replace with `useEffect` comparisons using `useRef` to track previous prop values. The backwards-chapter navigation should be modeled as a more explicit state machine (e.g. a `pendingNavigationTarget` value in Redux that Ultimate resolves once loaded).

---

#### C4 — Content flash: `book.content` mutation bypasses React rendering pipeline

**File:** `src/components/Reader/loader.js:114`, `src/components/Reader/index.jsx:46–48`

**Description:** When a new chapter loads, `book.content = bookContent` mutates a module-level object. The `BookContent` component reads from this object directly:

```js
function BookContent() {
  return <div key="book-content">{book.content}</div>
}
```

React has no knowledge that this mutation happened. The render of `BookContent` with new content is triggered indirectly by a `setState` call later, but there is a window where the module-level `book.content` has been updated but the component tree hasn't re-rendered. This is a root cause of content flash: the old content is replaced in the global before the spinner appears, and the spinner appears only after `freeze()` is called from within `loadSpineItem` — which happens _after_ the content has already been swapped.

**Proposed fix:** Move `bookContent` into Redux state (or at minimum into the `Reader` class component state) instead of a module-level mutable object. The render of `BookContent` should be gated by the `view.loaded` flag.

---

#### C5 — No loading state during initial OPF fetch

**Files:** `src/components/Reader/index.jsx:128–153`, `src/components/Reader/loader.js:76`

**Description:** The very first thing that happens when `Reader` mounts is an async OPF parse (`createStateFromOPF`), which makes several sequential network requests (OPF file, NCX file). During this time the spinner is not visible (it's only shown when `freeze()` is called, which happens inside `loadSpineItem`, which is called only _after_ `createStateFromOPF` completes). The user sees a blank, non-interactive reader with no feedback.

**Proposed fix:** Dispatch `showSpinner()` immediately on mount, before `createStateFromOPF` is called. Better yet, model the reader as a state machine with an explicit `initializing` state that shows a loading indicator.

---

### High

#### H1 — `withLastSpreadIndex`: Division by zero for scroll layout

**File:** `src/lib/with-last-spread-index.jsx:57`

**Description:**

```js
let frameHeight = props.getFrameHeight()
if (!isNumeric(frameHeight)) frameHeight = 0 // 'auto' → 0

const pages = contentDimensions / frameHeight / 2 // contentDimensions / 0 / 2 = Infinity
```

When the reader is in scroll layout, `getFrameHeight()` returns `'auto'`, which is explicitly set to `0`. Division by zero produces `Infinity`. The subsequent `Math.ceil(Infinity) - 1` = `Infinity`, which passes the `< 0` clamp check and gets dispatched as `lastSpreadIndex = Infinity`. This will break any navigation logic that compares spread indices against `lastSpreadIndex`.

**Proposed fix:** Guard against zero `frameHeight` before performing the division. For scroll layout, `lastSpreadIndex` should be `0` (there is only one "spread").

---

#### H2 — `withLastSpreadIndex`: `setInterval` runs forever with a `console.log` on every tick

**File:** `src/lib/with-last-spread-index.jsx:18–48`

**Description:** A `setInterval` at 1000ms fires indefinitely after the component mounts (the `useEffect` that creates it has an empty dependency array). On every tick it logs to the console (`console.log('update content dimensions', ...)` on line 42). This interval exists to detect content size changes, but:

1. It runs even when content is stable and no chapter change is occurring
2. The `console.log` pollutes the console in production
3. 1000ms is an arbitrary polling interval with no documented rationale

**Proposed fix:** Replace with a `ResizeObserver` on `node.current`. The observer fires only when the content element's size changes, eliminating polling entirely.

---

#### H3 — `Spread.jsx`: `setInterval` polling DOM layout every second per spread

**File:** `src/components/Spread.jsx:37`

**Description:** Each `Spread` component creates its own `setInterval(updatePosition, 1000)` to track `offsetLeft`. Since a chapter may contain many spreads, this creates N concurrent 1-second intervals (one per spread), all reading `offsetLeft` from the DOM every second forever.

**Proposed fix:** Same as H2 — replace per-spread polling with a single `ResizeObserver` or propagate layout info from a higher-level component via context instead of measuring per-spread.

---

#### H4 — `resize.js`: `bindResizeHandlers` / `unbindResizeHandlers` names are inverted

**File:** `src/components/Reader/resize.js:63–99`

**Description:** The function named `bindResizeHandlers` (line 63) calls `removeEventListener` — it _unbinds_. The function named `unbindResizeHandlers` (line 82) calls `addEventListener` — it _binds_. The names are swapped. The call sites in `Reader/index.jsx` are:

```js
componentDidMount()       → this.unbindResizeHandlers()  // actually ADDS listeners ✓
componentWillUnmount()    → this.bindResizeHandlers()    // actually REMOVES listeners ✓
```

The behavior happens to be correct because the call sites also compensate for the inverted names. However, this is a maintenance trap: any new call site will do the opposite of what it intends.

**Proposed fix:** Rename `bindResizeHandlers` → `removeResizeHandlers` and `unbindResizeHandlers` → `addResizeHandlers`, and update all call sites to match.

---

#### H5 — `ReaderContext.Provider` constructs a new object on every render

**File:** `src/components/Reader/index.jsx:358–367`

**Description:**

```jsx
<ReaderContext.Provider
  value={{   // new object on every render
    lastSpread,
    spreadIndex,
    getTranslateX: this.getTranslateX,
    navigateToChapterByURL: this.navigateToChapterByURL,
    getSpineItemByAbsoluteUrl: this.getSpineItemByAbsoluteUrl,
  }}
>
```

A new context value object is created on every render of `Reader`. Every consumer of `ReaderContext` (e.g. `Layout`, `SpreadFigure`) will re-render every time `Reader` re-renders, regardless of whether the relevant values changed. There is even an ESLint suppression comment acknowledging this: `// eslint-disable-next-line react/jsx-no-constructed-context-values`.

**Proposed fix:** Memoize the context value with `useMemo` (in a functional component) or store it as an instance property and only update it when the relevant values change.

---

#### H6 — `Layout.jsx`: `debounce` called inside render body creates a new function on every render

**File:** `src/components/Layout.jsx:175`

**Description:**

```js
const handleResize = debounce(onResizeDone, RESIZE_DEBOUNCE_TIMER, {})
```

This runs inside the `Layout` function body on every render, creating a brand-new debounced function instance each time. The old debounced function (with any accumulated timer state) is discarded. The new one is then re-registered on the `resize` event inside a `useEffect` with an empty dependency array — meaning the listener is registered once but it closes over the _first_ render's debounced function. Any subsequent renders create new debounced functions that are never attached to the event listener.

**Proposed fix:** Wrap `handleResize` in `useCallback` and create the debounced version with `useMemo` or `useRef`.

---

#### H7 — `navigateToElementById`: hardcoded element IDs and magic number division

**File:** `src/components/Reader/navigation.js:109–139`

**Description:** Two issues:

1. `document.getElementById('frame')` (line 121) and `document.querySelector('.bber-controls__header')` (line 118) are hardcoded DOM selectors. If these elements are ever renamed or removed, the failure is silent.
2. `const spreadIndex = Math.floor(left / frameHeight / 2)` (line 136): the `/2` is unexplained. It appears to account for the 2-column layout but has no guard for scroll mode and no comment.

**Proposed fix:** Pass refs down from the `Frame` and `Controls` components rather than querying the DOM by ID. Document (or derive) the `/2` factor.

---

### Medium

#### M1 — No error boundary anywhere in the component tree

**Description:** A parse error in `XMLAdaptor`, a malformed spine item URL, or a runtime error in any spread component will propagate uncaught and crash the entire reader, showing a blank screen with no user feedback. There are no React error boundaries.

**Proposed fix:** Add an `ErrorBoundary` component wrapping `Frame` (and ideally also wrapping `BookContent`) that displays a meaningful error message and optionally a retry button.

---

#### M2 — `loadSpineItem` error handler silently freezes the UI

**File:** `src/components/Reader/loader.js:96–108`

**Description:** When the `try` block in `loadSpineItem` catches an error (network failure, parse error), it logs to the console, clears localStorage, and `return`s. It does not call `showSpineItem` or update any UI state. Since `freeze()` was called before the `try` block, the spinner is still visible and the UI is still locked. The app appears completely frozen with no error message.

**Proposed fix:** In the `catch` block, dispatch a Redux action to display an error state, hide the spinner, and restore `handleEvents: true`.

---

#### M3 — Backwards-chapter navigation relies on fragile `chapterDelta` timing

**Files:** `src/components/Reader/navigation.js:94`, `src/components/Reader/index.jsx:232–238`

**Description:** When navigating to the previous chapter, `chapterDelta: -1` is set in state. Later, in `UNSAFE_componentWillReceiveProps`, when `view.loaded` becomes true and `lastSpreadIndex > -1`, the code checks `chapterDelta < 0` and navigates to the last spread. This works only if:

1. `UNSAFE_componentWillReceiveProps` fires after both `view.loaded` and `view.lastSpreadIndex` are set
2. `chapterDelta` hasn't been reset before the check fires
3. The user doesn't navigate again during the load

There's no explicit synchronization between these states — the timing is assumed.

**Proposed fix:** Model backwards-chapter navigation as a `pendingTarget: 'last'` field in `view` Redux state. When `Ultimate` detects stability and dispatches `view.load()`, check for a pending target and dispatch the appropriate navigation.

---

#### M4 — Commented-out and dead code obscures intent

**Files:** `src/components/Reader/navigation.js:52–83`, `src/components/Reader/index.jsx:169–248`, `src/components/Reader/loader.js:131–135`

**Description:** Large blocks of commented-out `deferredCallback` logic exist throughout the navigation and loader code. These appear to be an older navigation pattern that was partially refactored away. The presence of this code (including commented-out `TODO move this logic` notes) makes it difficult to understand the intended flow.

**Proposed fix:** Remove all commented-out code. If the deferred callback pattern is needed in the future, it can be recovered from git history.

---

#### M5 — Debug `console.log` statements present in production paths

**Files:**

- `src/components/Reader/index.jsx:228` — `'--- ok show'`
- `src/components/Reader/index.jsx:255,260` — `'--- reader calls unload'`, `'this.props.userInterfaceActions.update'`
- `src/components/Reader/navigation.js:33` — `'handleChapterNavigation'`
- `src/components/Reader/loader.js:51,71` — `'showSpineItem'`, `'loadSpineItem'`
- `src/lib/with-last-spread-index.jsx:42` — `'update content dimensions'` (fires every second)
- `src/components/Ultimate.jsx:40` — `'prevlefts no node'`

**Proposed fix:** Remove all `console.log` debug statements. Replace with structured logging behind a `DEBUG` flag if logging is needed.

---

#### M6 — `Spread.jsx`: height multiplier is unexplained

**File:** `src/components/Spread.jsx:47–52`

**Description:**

```js
const nextVerso = offset === 0 || offset % 1 === 0
const nextMultiplier = nextVerso ? 2 : 3
```

A spread on a verso page (left-hand column of a 2-column layout) has height multiplied by 2, and a recto spread by 3. The rationale — that the CSS `columns` layout needs elements at specific heights to force correct column flow — is not documented anywhere. The specific values `2` and `3` are magic.

**Proposed fix:** Document the column-flow rationale with a comment. Consider deriving the multiplier from the number of columns rather than hard-coding `2` and `3`.

---

### Low

#### L1 — `App.jsx` and `Frame.jsx` manipulate `document.body` styles directly

**Files:** `src/components/App.jsx:26–29`, `src/components/Frame.jsx:23`

**Description:** On mount, `App` sets `document.body.style` properties directly. This is a side effect that persists after the component unmounts and conflicts with any other styles applied to `document.body` by the host application.

**Proposed fix:** Use a CSS class on `document.body` (added/removed on mount/unmount) rather than inline styles.

---

#### L2 — `withLastSpreadIndex`: `setContentDimensions(0)` on slug change may trigger a layout recalculation cycle

**File:** `src/lib/with-last-spread-index.jsx:14–16`

**Description:** When the slug changes (new chapter), `contentDimensions` is reset to `0`. The `useEffect` that watches `contentDimensions` (line 50) will then fire with `contentDimensions = 0`, calculating `lastSpreadIndex = -1` and dispatching it. This triggers a Redux update mid-chapter-load that any consumer of `lastSpreadIndex` must handle gracefully.

**Proposed fix:** Guard the `useEffect` on `contentDimensions` to skip the dispatch when `contentDimensions === 0`, or only dispatch when the value is positive and numerically valid.

---

#### L3 — `Spread.jsx` generates random IDs on every mount

**File:** `src/components/Spread.jsx:21`

```js
const id = useMemo(() => (Math.random() + 1).toString(36).substring(7), [])
```

Random IDs cannot be relied on for targeting, are not stable across renders, and make debugging harder. If these IDs are only used as a DOM `id` attribute for styling purposes, they serve no function that a class name or a deterministic index can't fulfill.

---

#### L4 — `Spread.jsx` subscribes to `markers` from Redux but never uses it

**File:** `src/components/Spread.jsx:120–127`

```js
connect(
  ({ readerSettings, viewerSettings, markers }) => ({
    readerSettings,
    viewerSettings,
    markers, // never referenced in the component
  }),
  () => ({})
)(Spread)
```

Every change to `markers` state will cause every `Spread` to re-render unnecessarily.

---

## 3. Path to Modernization

The goal is to migrate from the current stack (React class components, deprecated lifecycles, Redux-heavy) to TypeScript, React 18+, modern hooks, and a simpler state model. Three approaches are outlined below, ordered from lowest to highest risk.

---

### Option A — Incremental In-Place Migration

**Strategy:** Convert and modernize the existing codebase file by file, starting from the leaves and working inward. Each phase produces a shippable release.

**Phase 1: Housekeeping (no architectural change)**

- [ ] Remove all debug `console.log` statements
- [ ] Remove all commented-out dead code
- [ ] Fix the `bindResizeHandlers`/`unbindResizeHandlers` naming confusion
- [ ] Add a top-level `ErrorBoundary`
- [ ] Fix the division-by-zero bug in `withLastSpreadIndex`
- [ ] Fix the `loadSpineItem` error handler (unhide spinner on failure)

**Phase 2: Replace polling with observers**

- [x] Replace `Ultimate.jsx` RAF loop with a `ResizeObserver` or `MutationObserver` on the sentinel element
- [x] Replace `withLastSpreadIndex` `setInterval` with `ResizeObserver`
- [ ] Replace per-`Spread` `setInterval` with a single layout observer propagated via context

**Phase 3: Migrate deprecated React patterns**

- [x] Convert `App.jsx` from `UNSAFE_componentWillMount` to `componentDidMount`
- [x] Convert `Reader/index.jsx` from class to functional component using `useReducer` for local state
- [x] Replace `UNSAFE_componentWillReceiveProps` in `Ultimate` with `useEffect` + `useRef` previous-value tracking
- [ ] Replace `UNSAFE_componentWillReceiveProps` in `Reader` with `useEffect` + `useRef` previous-value tracking
- [ ] Memoize `ReaderContext.Provider` value

**Phase 4: TypeScript adoption**

- [ ] Add `tsconfig.json` and configure Webpack to handle `.ts`/`.tsx`
- [ ] Migrate utility helpers first (`Url`, `Storage`, `Request`, `Viewport`) — they have clear inputs/outputs
- [ ] Migrate models (`SpineItem`, `ViewerSettings`, `BookMetadata`)
- [ ] Migrate components bottom-up: leaf components first, then HOCs, then `Layout`, then `Reader`
- [ ] Replace `index.d.ts` (manual declarations) with generated types from the source

**Phase 5: Redux modernization**

- [ ] Replace Redux + `redux-thunk` with Redux Toolkit (`createSlice`, `createAsyncThunk`)
- [ ] Evaluate replacing Redux entirely with `useContext` + `useReducer` for simpler state
- [ ] Move `spine`, `currentSpineItem`, and `currentSpineItemIndex` out of Reader local state and into Redux

**Pros:**

- Continuous shipability — every phase improves the app without a full rewrite
- Git history remains meaningful
- Risk is limited to one phase at a time
- Easier for a solo maintainer to manage

**Cons:**

- Slower overall
- Some phases are constrained by earlier architectural decisions
- The HOC chain (`withDimensions` → `withLastSpreadIndex` → `Layout`) is hard to fully modernize without touching all three at once

---

### Option B — Parallel Rewrite with Feature Parity Gate

**Strategy:** Build a new version of the reader (`src-v2/`) alongside the existing one, driven by the same Redux store and manifests. Switch over when feature parity is reached.

**Architecture for v2:**

```
src-v2/
  store/                    # Redux Toolkit slices (TypeScript)
    readerSlice.ts
    viewSlice.ts
    uiSlice.ts
    settingsSlice.ts
  hooks/                    # Custom hooks replacing HOCs
    useBook.ts              # OPF loading, spine management
    useNavigation.ts        # Page/chapter navigation
    useLayout.ts            # Column layout calculations
    useResize.ts            # Resize handling
    useContentReady.ts      # Replaces Ultimate.jsx
  components/               # All functional TypeScript components
    Reader.tsx
    Layout.tsx
    Spread.tsx
    Frame.tsx
    Controls/
    Navigation/
    Sidebar/
    Media/
  context/
    ReaderContext.tsx        # Typed context with useMemo
    SpreadContext.tsx
```

**Key design decisions for v2:**

- **No more `book` global** — content is stored in a Redux slice and rendered reactively
- **No more polling** — `ResizeObserver` / `MutationObserver` replace all `setInterval` / RAF loops
- **No more HOCs** — `withDimensions`, `withLastSpreadIndex`, `withNodePosition` become custom hooks
- **Typed manifests** — `SpineItem`, `GuideItem`, `BookMetadata` become proper TypeScript interfaces
- **State machine for loading** — the reader's loading states (`idle`, `loading-manifest`, `loading-chapter`, `ready`, `error`) are modeled explicitly rather than derived from combinations of flags
- **Explicit navigation model** — forward/backward navigation targets (including "navigate to last spread of prev chapter") are stored as pending intents in state, resolved by the readiness observer

**Pros:**

- Clean architecture unconstrained by legacy decisions
- TypeScript from the start means better tooling throughout
- Easier to write tests for hooks than for class components

**Cons:**

- No value shipped until feature parity is reached
- Higher risk of missing edge cases that the existing code handles
- Requires maintaining two codebases during transition

---

### Option C — Custom Hook Extraction (Minimal Disruption)

**Strategy:** Extract the complex stateful logic from the class component into custom hooks, leaving the overall structure mostly intact. This is a middle path between A and B.

**Core hooks to extract:**

| Hook                                      | Replaces                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `useBookLoader(bookURL)`                  | `createStateFromOPF` + `loadSpineItem` + `showSpineItem`                       |
| `useNavigation(spine, view)`              | `handlePageNavigation` + `handleChapterNavigation` + `navigateToSpreadByIndex` |
| `useResize(spreadIndex, lastSpreadIndex)` | `resize.js` + `Reader` resize state                                            |
| `useContentReady(slug)`                   | `Ultimate.jsx` + `withLastSpreadIndex`                                         |
| `useLayout(readerSettings)`               | `withDimensions` + parts of `ViewerSettings` model                             |

Once the hooks exist, `Reader/index.jsx` becomes a thin orchestrator:

```tsx
function Reader(props) {
  const book = useBookLoader(props.readerSettings.bookURL)
  const nav = useNavigation(book.spine, props.view)
  const layout = useLayout(props.readerSettings)
  const isReady = useContentReady(nav.currentSlug)
  useResize(nav.spreadIndex, props.view.lastSpreadIndex)

  return (
    <ReaderContext.Provider value={...}>
      <Controls {...nav} {...book}>
        <Frame>
          <Layout {...layout} isReady={isReady} />
        </Frame>
      </Controls>
    </ReaderContext.Provider>
  )
}
```

**Pros:**

- Hooks can be TypeScript from day one
- Dramatically improves testability (hooks are unit-testable without rendering)
- Less disruption to the outer component API than a full rewrite

**Cons:**

- The class-component shell remains until a later phase
- Some hooks will need to replicate the `this.state` / `this.props` patterns until the class is fully removed

---

### Recommendation

For a solo maintainer of a legacy application, **Option A (incremental)** is the most practical starting point. Phases 1 and 2 directly address the most critical bugs and deliver immediate quality improvements with minimal risk. Phase 3 (React modernization) can be tackled component by component. TypeScript adoption (Phase 4) is best deferred until the component structure is stable.

If the application needs a significant feature expansion or there is capacity for a dedicated sprint, **Option C** (custom hook extraction) is a good bridge — it doesn't require maintaining two codebases and produces reusable, testable code that can be incrementally composed into a full rewrite later.

---

## 4. Timeline

All estimates assume a single developer working part-time on this codebase alongside other responsibilities, at roughly 6–8 focused hours per week.

> Note: These are rough order-of-magnitude estimates, not commitments. The actual time will depend heavily on how deeply the current behavior is tested and how many edge cases surface during migration.

---

### Option A — Incremental (recommended for solo maintenance)

| Phase       | Scope                                                                                                         | Estimated Duration |
| ----------- | ------------------------------------------------------------------------------------------------------------- | ------------------ |
| **Phase 1** | Housekeeping: remove logs, dead code, fix naming, add `ErrorBoundary`, fix division-by-zero and error handler | 1–2 weeks          |
| **Phase 2** | Replace polling with `ResizeObserver` in `Ultimate`, `withLastSpreadIndex`, `Spread`                          | 2–3 weeks          |
| **Phase 3** | Convert `App`, `Reader`, `Ultimate` away from deprecated lifecycles; memoize context                          | 3–4 weeks          |
| **Phase 4** | TypeScript adoption (helpers → models → components, bottom-up)                                                | 6–10 weeks         |
| **Phase 5** | Redux Toolkit migration; move spine/chapter state to Redux                                                    | 2–4 weeks          |
| **Total**   |                                                                                                               | **~14–23 weeks**   |

---

### Option B — Parallel Rewrite

| Phase                 | Scope                                                                                   | Estimated Duration |
| --------------------- | --------------------------------------------------------------------------------------- | ------------------ |
| **Foundation**        | Set up TypeScript, Redux Toolkit, project structure; migrate helpers and models         | 2–3 weeks          |
| **Core hooks**        | Implement `useBookLoader`, `useNavigation`, `useContentReady`, `useLayout`, `useResize` | 4–6 weeks          |
| **Components**        | Build all functional components in TypeScript; implement all layout modes               | 4–6 weeks          |
| **Feature parity**    | QA, edge cases (backward nav, resize, scroll mode, media, footnotes, markers)           | 3–5 weeks          |
| **Cutover + cleanup** | Swap in new reader, remove old code, update package API                                 | 1–2 weeks          |
| **Total**             |                                                                                         | **~14–22 weeks**   |

---

### Option C — Custom Hook Extraction (middle path)

| Phase               | Scope                                                                                 | Estimated Duration |
| ------------------- | ------------------------------------------------------------------------------------- | ------------------ |
| **Housekeeping**    | Same as Phase 1 of Option A                                                           | 1–2 weeks          |
| **Hook extraction** | Extract `useBookLoader`, `useNavigation`, `useResize`, `useContentReady`, `useLayout` | 4–6 weeks          |
| **Reader refactor** | Convert Reader class to functional shell using hooks                                  | 2–3 weeks          |
| **TypeScript**      | Type the hooks and components                                                         | 4–6 weeks          |
| **Total**           |                                                                                       | **~11–17 weeks**   |

---

### Quick Wins (can be done immediately, < 1 week total)

These are high-impact, low-risk changes that can be made before committing to any migration path:

- [ ] Remove all `console.log` debug statements (C5/M5)
- [ ] Fix division-by-zero in `withLastSpreadIndex` for scroll layout (H1)
- [ ] Fix `loadSpineItem` error handler to show an error state instead of freezing (M2)
- [ ] Add a top-level `ErrorBoundary` component (M1)
- [ ] Show spinner on initial mount before OPF fetch begins (C5)
- [ ] Rename `bindResizeHandlers` / `unbindResizeHandlers` to accurate names (H4)
- [ ] Remove `markers` from `Spread`'s `connect` call since it's unused (L4)
