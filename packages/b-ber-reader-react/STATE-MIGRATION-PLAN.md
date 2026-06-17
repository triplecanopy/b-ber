# State management migration — research & plan

**Deliverable of TASK-073** (research/decision). The execution is a separate task
(**TASK-106**, Step 4) that follows this plan slice by slice.

> Read alongside [`MIGRATION-CONVENTIONS.md`](./MIGRATION-CONVENTIONS.md) — the
> behavior-preservation rule (§0), the per-commit verification gate (§1), and
> especially **§3e (render purity / `useSyncExternalStore`)**, which this design
> is built around.

---

## Recommendation

**Drop Redux. Replace it with a tiny hand-rolled external store read via
`useSyncExternalStore`, plus a stable ref-backed context for the imperative API.**
This is approach **B** (+ API-context split) from TASK-073, hybridised with plain
local `useState` for genuinely local UI. **RTK (approach C) is not warranted** —
no blocker was found. **Plain Context-as-store (approach A) is rejected for the
hot slices** (see re-render assessment).

Removes three runtime deps — `react-redux`, `redux`, `redux-thunk` — and the
`redux-mock-store` devDep.

### Why not Redux

The store is 6 small slices (UI flags, layout measurements, location, bookmarks).
The entire cost is ceremony: `connect()` on **14 components** + 3 Sidebars,
`bindActionCreators`, the loose `BoundActions` typing, and the HOC-injected `any`
debt ([[TASK-032]]). There is no middleware logic worth keeping (see thunks).

### Why not plain Context (approach A)

`viewerSettings` and `view`/`spreadIndex` change on every resize and page-turn. A
Context provider re-renders **all** consumers whenever its value changes, so
putting hot slices in Context produces re-render storms. That's the classic
Context-as-store trap. Context is the right tool for *distribution*, not for
*subscription to frequently-changing state*.

### Why `useSyncExternalStore` (approach B)

A single external store with **selector subscriptions** re-renders only the
components whose selected slice actually changed — no provider fan-out — and it's
the tear-free primitive for external state (§3e). It needs no state library; the
only optional dep is React's own `use-sync-external-store/with-selector` shim for
selector equality (see Gotchas).

---

## Current-state inventory (measured 2026-06-14)

### Slices, consumers, and change frequency

| Slice | Consumers (`connect`/hook) | Changes when | Heat |
| ----- | -------------------------- | ------------ | ---- |
| `readerSettings` | Link, Spread, App, Controls, Frame, Sidebar×3, Reader, `useNodePosition` | once at mount (props → `mergeDeep`) | **cold** |
| `markers` | Marker (+ Spread subscribes but never uses → [[TASK-068]] L4) | user bookmarks (rare) | **cold** |
| `readerLocation` | App, Reader | navigation | warm |
| `userInterface` | Layout, Spinner, Controls, Reader, `useNavigationActions` | freeze / navigate / spinner | warm |
| `view` | Spread, Ultimate, Reader, `useNodePosition` | load + settle (`loaded`, `lastSpreadIndex`, `ultimateOffsetLeft`) | **hot** |
| `viewerSettings` | Spread, Footnote, Controls, Frame, Reader, `useDimensions`, `useNodePosition` | every resize / load | **hot** |

The two hot slices (`view`, `viewerSettings`) are exactly the ones that make
plain Context untenable and that the re-render prototype must validate.

### Actions

~20 plain action creators (`update`, `load`, `disablePageTransitions`, …) — all
trivial `{ type, payload }` dispatchers. **3 thunks:**

| Thunk | Reality |
| ----- | ------- |
| `viewerSettings.load` | **dead** — no-op TODO, dispatches an empty action; no call site |
| `viewerSettings.save` | **dead** — reads state + `Storage.set`; no call site |
| `readerLocation.setInitialSearchParams` | **live, trivial** — reads `getState().readerSettings` synchronously and dispatches `updateLocation`; called once in `App` mount |

**Thunks are a non-issue.** Two are dead (delete them). The one live thunk reads
the store snapshot synchronously — it ports directly to a plain function that
reads `store.getSnapshot()` and calls a setter. The real async (the OPF/spine
fetch) already lives in `useLoader`/`useNavigation` and only dispatches plain
updates — it never went through thunk middleware.

### Already migrated

`useDimensions`, `useNavigationActions`, `useNodePosition` already use
`useSelector`/`useDispatch` (the HOC→hook wave converted the HOCs' own Redux
access). So only **component-level `connect()`** remains — §3b deliberately
deferred that to this task.

### Adjacent state not in Redux

- **`book.content`** — module-level global rendered straight into JSX
  (`Reader/index` `BookContent`). Render-pipeline bypass + tear risk (§3e).
- **`reader-context`** — imperative + positional: `getTranslateX`,
  `navigateToChapterByURL`, `getSpineItemByAbsoluteUrl` (stable) plus reactive
  `spreadIndex`/`lastSpread`.
- **`spread-context`** — `{ left, layout }` for `SpreadFigure` positioning.
- **`apiRef`** in `Reader/index` — the imperative method bag (`freeze`,
  `navigate*`, `loadSpineItem`) currently threaded via `deps`.
- **Caches** — `Storage` (localStorage), `Cache`, and `XMLAdaptor`'s spine cache.

---

## Re-render assessment (hot slices)

- **Redux today:** `connect()` + `react-redux` already does selector-level
  bailout, so a `viewerSettings` change only re-renders its subscribers. The
  migration must **preserve that** — i.e. not regress to broad re-renders.
- **Approach A (Context) would regress it:** any `viewerSettings` write re-renders
  every consumer of that provider. Rejected for hot slices.
- **Approach B preserves it:** `useSyncExternalStore(subscribe, () =>
  selector(snapshot))` re-renders a component only when *its* selected value
  changes, equivalent to `connect`'s bailout, with no provider in the render path.
- **Action item for TASK-106:** prototype `viewerSettings` under B, assert the
  re-render count for a resize matches the `connect` baseline (React DevTools
  Profiler or a render-counter in a test).

---

## Target architecture

### 1. The store (no library)

```ts
// store/createReaderStore.ts
type Listener = () => void

export function createReaderStore(initial: AppState) {
  let state = initial
  const listeners = new Set<Listener>()

  return {
    getSnapshot: () => state,
    subscribe: (l: Listener) => (listeners.add(l), () => listeners.delete(l)),
    setState: (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => {
      const next = typeof patch === 'function' ? patch(state) : patch
      state = { ...state, ...next }   // shallow slice merge, like combineReducers
      for (const l of listeners) l()
    },
  }
}
```

- **Created per `Reader` instance** (not a module singleton) and seeded with the
  merged `readerSettings` props — preserves multi-instance mounting and the
  current prop-seeding behavior. The store object is provided via a
  `StoreContext` whose **value identity never changes** (so the context itself
  never triggers re-renders).
- Reducers' update logic collapses into typed setter functions (or one
  `setState(patch)` per slice). Keep the action-type constants only if they aid
  readability; otherwise inline.

### 2. Reading state

```ts
const width = useStore(s => s.viewerSettings.width)
```

`useStore` wraps `useSyncExternalStoreWithSelector(store.subscribe,
store.getSnapshot, store.getSnapshot, selector, isEqual)`.

### 3. The two-context split

- **`StoreContext`** — the reactive store object (stable identity). Read via
  `useStore(selector)`.
- **`ReaderApiContext`** — the **stable, ref-backed** imperative API. Identity
  never changes → no re-render churn.

  **As built (TASK-106, deviations from the original sketch above):**
  - The context carries only the methods that deep descendants actually consume
    through context: `getTranslateX`, `navigateToChapterByURL`,
    `getSpineItemByAbsoluteUrl` (consumed by Link, SpreadFigure, Layout,
    `useNodePosition`). `freeze`/`navigate*`/`loadSpineItem` are **not** put on
    the context — they are called internally via `apiRef` or passed to `Controls`
    as props, so exposing them through context would be dead surface. The
    `apiRef`/`deps` threading in `Reader/index` therefore stays (it is what the
    context value delegates to).
  - The reactive bits (`spreadIndex`/`lastSpread`) were **kept as `Reader` local
    state**, exposed through a slimmed reactive `ReaderContext` (`{ spreadIndex,
    lastSpread }`), rather than moved into the store. Reason: they are written
    **atomically** alongside the rest of `Reader`'s navigation local-state
    (`currentSpineItem`, `slug`, `firstChapter`, …) in single `setState` calls,
    and read synchronously via `stateRef` in `updateQueryString`/`savePosition`.
    Fragmenting just those two fields into the store would split each atomic
    navigation write across two update systems (store + React state) and
    complicate the after-commit callback ordering (`updateQueryString`,
    `loadSpineItem`) — for **zero** consumer benefit, since the only reactive
    consumers (`Vimeo`, `useMediaPlayer`) are equally served by the slim context.
    This also resolves the "decide `Reader` local-state placement" sub-point: all
    of `Reader`'s orchestration state stays local; the store holds only the
    cross-cutting slices.

### 4. `book.content`

Move into the store as `content: { spineItemURL, node }`, written in **one**
`setState` so URL and rendered tree update atomically. `BookContent` becomes
`const node = useStore(s => s.content.node)` — a pure, tear-free read. Removes the
module global and the `key`-prop remount hack.

### 5. Caching

Mostly **leave as-is**: the cache is read *imperatively* in `useLoader`, which is
correct and needs no subscription. Only wrap a cache/localStorage read in
`useSyncExternalStore` where a component must *react* to cache changes (none do
today). So this is a targeted, optional follow-on — **not** a blanket rewrite.
(Corrects the earlier blanket "move caching to `useSyncExternalStore"`.)

---

## Migration sequence (for TASK-106 — Step 4)

Incremental, behavior-preserving, **one slice per commit**, `npm test` green + 9
snapshots unchanged at each step:

1. **Scaffold** `createReaderStore` + `StoreContext`/`StoreProvider` + `useStore`
   + a test harness (`renderWithStore`) — runs **alongside** Redux; both stores
   seeded identically. No component migrated yet.
2. **Cold slices first:** `readerSettings`, then `markers`. Lowest risk; proves
   the pattern end-to-end (read path, setter path, tests).
3. **Warm:** `userInterface`, `readerLocation`. Port `setInitialSearchParams` to a
   plain snapshot-reading function; delete the two dead `viewerSettings` thunks.
4. **Hot:** `view`, then `viewerSettings` — **with the re-render prototype/check**
   before and after.
5. **`book.content`** into the store (atomic with `spineItemURL`); drop the
   `key`-remount hack once content is a normal subscribed read.
6. Decide `Reader` local state (`spine`/`currentSpineItem*`): move into the store
   or keep local — pick based on who else needs it (Controls/Sidebars read spine).
7. **Remove `connect()`** per component as its slices migrate; collapse
   `reader-context` per the API-context split.
8. **Delete** `react-redux`, `redux`, `redux-thunk`, `redux-mock-store`, the
   `Provider`, reducers, and thunk plumbing once nothing imports them. Tighten the
   `BoundActions`/injected-`any` types ([[TASK-032]] debt) as they disappear.

---

## Gotchas / risks (call out in TASK-106)

- **Selector stability:** `useSyncExternalStore` loops infinitely if `getSnapshot`
  (or a selector) returns a *new* object each call. Selectors must return
  primitives or referentially-stable values; for derived objects use
  `useSyncExternalStoreWithSelector` (React's own
  `use-sync-external-store/with-selector` — a tiny official shim, not a state lib)
  with an equality fn, or memoize. This is the single biggest footgun.
- **StrictMode** double-subscribe/unsubscribe — the `subscribe` cleanup must be
  exact (it is, with the `Set` delete).
- **SSR** — reader is client-only; `getServerSnapshot` can just return
  `getSnapshot`.
- **Test surface is large:** many suites use `createTestStore` (redux) + RTL
  `Provider`. Each migrated slice needs its tests moved to `renderWithStore`.
  Mechanical but broad — budget for it; keep the 458/9 gate per commit.
- **Behavior preservation (§0):** this is a *how*, not a *what* change. No batching
  regressions (§3c) — the new `setState` is synchronous-notify like Redux; keep
  multi-write clusters atomic.

---

## Decision log

- **2026-06-13** (user): lean away from Redux toward built-in tools; RTK is the
  fallback, not the default; reduce third-party deps.
- **2026-06-14** (this research): confirmed **B + stable API context** (hybrid).
  Thunks are a non-issue (2 dead, 1 trivial). Plain Context (A) rejected for hot
  slices on re-render grounds. RTK (C) not needed — no blocker found. Caching
  stays imperative except where a component must react. Execution tracked in
  **TASK-106**.
