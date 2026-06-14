# TASK-073: Research — replace Redux with built-in React state management

**Status:** not started
**Feature:** React 19 (reader-react)
**Phase:** Modernization — state management (Step 3 of the React 19 plan)
**Priority:** medium
**Model:** Opus — architectural research + decision (the biggest fork in the
migration); the resulting execution task can be Sonnet, slice by slice.

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> first — §3e (render purity / `useSyncExternalStore`) directly informs the
> store design and the `book.content` handling evaluated here.

> **This is a research + decision task, not the migration itself.** Its output is
> a written recommendation and a concrete migration plan; the actual state-layer
> migration is a separate execution task (Step 4) opened from the findings here.

## Decision direction (set by user, 2026-06-13)

The strong lean is **away from Redux entirely** toward built-in React state, for
two reasons the user stated explicitly:

1. This app does not appear to need the overhead of Redux Toolkit — the state is
   modest and could be managed more efficiently with built-in tools
   (`useReducer` + `Context`, `useSyncExternalStore`, or a tiny custom store).
2. Reduce dependency on third-party libraries wherever possible (drops
   `react-redux`, `redux`, `redux-thunk`).

So **Redux Toolkit is the fallback, not the default.** The research should
seriously test whether built-in tools cover every current slice and access
pattern, and only fall back to RTK if a concrete blocker is found.

## Description

The current setup uses plain Redux + `redux-thunk` with manually written action
creators and reducers, read via `react-redux` `connect()` HOCs. This task
evaluates how to retire that in favor of built-in React state, and produces the
migration plan.

**Candidate approaches to evaluate (in preference order):**

- **A — `useReducer` + `Context` (split by concern).** Co-locate each slice's
  reducer with a context provider; consume via hooks. Most idiomatic, zero deps.
  Risk: context re-render fan-out for hot slices (`view`, `viewerSettings`).
- **B — `useSyncExternalStore` over a tiny hand-rolled store.** Keeps a single
  external store (selector subscriptions, no provider re-render fan-out) without
  any library. Good if context fan-out proves to be a problem.
- **C — Redux Toolkit (`createSlice`).** Fallback only — keeps a third-party dep;
  justify with a concrete blocker if recommended.

**Deliverable:** a recommendation (A/B/C or hybrid), a slice-by-slice migration
plan, a re-render/perf assessment for the hot slices, and the handling plan for
the `book.content` global and `redux-thunk` async flows (loader/navigation).

## Current Redux slices

| Slice            | Description                                            |
| ---------------- | ------------------------------------------------------ |
| `readerSettings` | Book URL, manifest URL, static config                  |
| `readerLocation` | Current slug, search params, hash                      |
| `userInterface`  | Spinner, sidebar, marker visibility, handleEvents      |
| `view`           | Loaded state, lastSpreadIndex, spreadIndex             |
| `viewerSettings` | Computed layout dimensions (padding, column gap, etc.) |
| `markers`        | User bookmarks                                         |

## Subtasks (research)

- [ ] Inventory every read/write of each slice (which components, via `connect`
      vs hooks) and identify the hot slices (`view`, `viewerSettings`) for the
      re-render assessment
- [ ] Map each `redux-thunk` async flow (loader fetch, navigation) to its built-in
      equivalent (effect + reducer dispatch, or async fn writing to the store)
- [ ] Prototype the riskiest slice (`view` or `viewerSettings`) under approach A
      and, if context fan-out is a concern, under approach B; measure re-renders
- [ ] Decide A / B / C (or hybrid) and write the recommendation
- [ ] Produce the slice-by-slice migration plan + the `book.content` global plan
- [ ] Open the execution task (Step 4) from the recommendation; link it here

## Migration sequencing (for the execution task, not this one)

Behavior-preserving, one slice at a time, simplest first:
`userInterface` → `viewerSettings` → `view` → `readerLocation` → `readerSettings`
→ `markers`; then move `spine`/`currentSpineItem`/`currentSpineItemIndex` out of
`Reader` local state; then remove the `connect()` HOCs; `npm test` green +
snapshots unchanged at each step.

## Findings so far (post Steps 1–2, 2026-06-14)

After the class→functional + HOC→hook waves, here's the read on the A/B/C
decision and adjacent questions raised in code review:

- **Redux is not earning its keep.** 6 small slices (mostly UI booleans +
  measurements + location). Cost is all ceremony: `connect()` on ~10 components,
  `bindActionCreators`, the loose `BoundActions` typing, and the prop-injection
  `any` debt ([[TASK-032]]).
- **Thunks are effectively a non-issue.** The async orchestration already lives
  in the hooks (`useLoader`/`useNavigation`); they dispatch plain `update(...)`
  actions — there's no meaningful thunk-middleware logic to port. Confirm by
  inventorying the action creators, but expect "no real async in Redux."
- **Plain Context is the wrong replacement for the hot slices.** `viewerSettings`
  and `spreadIndex` change on every resize/page-turn; Context fans re-renders out
  to all consumers on any value change → re-render storms. The classic
  Context-as-store trap; rules out approach **A** for those slices.
- **Lean: B (`useSyncExternalStore` over a tiny hand-rolled store).** A small
  external store (plain object + `subscribe`/`getSnapshot`) read via
  `useSyncExternalStore(subscribe, () => selector(snapshot))` gives selector-level
  subscriptions, no provider re-render cascade, no third-party dep, and is the
  §3e tear-free primitive. Likely **hybrid**: B for hot/global state, plain
  `useState`/local context for genuinely local UI bits.
- **Split reactive state from the imperative API.** Two contexts:
  (a) the reactive store (via `useSyncExternalStore` + selectors), and (b) a
  **stable** `ReaderApi` context (ref-backed; identity never changes) holding the
  imperative methods (`freeze`, `navigate*`, `loadSpineItem`). (b) replaces the
  `apiRef`/`deps` threading in `Reader/index` without re-render churn.
- **`book.content` gets a tear-free home.** Fold `{ spineItemURL, content }` into
  one atomic store transition so the URL and the rendered tree update together
  (kills the module-global render bypass and the `key`-prop remount hack).
- **Caching reads fit the same primitive.** `Storage` (localStorage) and the
  `Cache`/`XMLAdaptor` cache are external mutable stores read imperatively today;
  read them through the same `useSyncExternalStore` abstraction so they don't
  tear. Build one small external-store helper and reuse it for app state + cache.

Net: the research should seriously try to land on **B (+ a stable API context)**
and only fall back to RTK (C) on a concrete blocker.

## Notes

- **Unblocked:** the TS conversion (TASK-032) is complete, so the slices are
  already typed — the original "wait for TypeScript" prerequisite is satisfied.
- The `book.content` module-level global is the last major bypass of the React
  rendering pipeline; folding it into the new state layer is part of the plan.
- Best done **after** the class→functional + HOC→hooks waves (Steps 1–2): with
  components already functional, swapping `connect`/`mapStateToProps` for hooks
  (or a built-in store) is far smaller and lower-risk.
