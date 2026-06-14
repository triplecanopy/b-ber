# TASK-100: Remove the selfRef shim — extract navigation/loader/resize into hooks

**Status:** complete
**Feature:** React 19 (reader-react)
**Scope:** b-ber-reader-react
**Phase:** Modernization — Step 2 (HOC→hooks / finalize functional Reader)
**Priority:** high
**Model:** Opus — the most entangled change in the migration. `navigation.ts`,
`loader.ts`, and `resize.ts` still use `this.state`/`this.props`/`this.setState`
through a `selfRef` shim; untangling that into hooks while preserving the exact
load/navigation/resize behavior (including the spinner sequence) is high-judgment.

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> first. This is the change most able to reintroduce the spread-cluster spinner
> bugs — verify the load/resize sequences against `SPREAD-CLUSTER-QA.md`.

## Description

`Reader/index.tsx` is already a functional component, but it keeps a `selfRef`
shim so the extracted modules `navigation.ts`, `loader.ts`, and `resize.ts` can
continue to use `this.*`. Convert those modules into custom hooks
(e.g. `useNavigation`, `useLoader`, `useResize`) that take the real state/refs/
dispatch they need, and remove the shim. This is the long-standing Phase-3
leftover and the last major non-idiomatic pattern in the orchestrator.

## Subtasks

- [x] Map the `selfRef` surface: enumerate every `this.state`/`this.props`/
      `this.setState`/`this.<method>` access in navigation/loader/resize
- [x] Extract `loader.ts` → `useLoader` (OPF/NCX fetch, spine parse,
      `book.content` population); preserve the load/spinner ordering exactly
- [x] Extract `navigation.ts` → `useNavigation` (page + chapter navigation)
- [x] Extract `resize.ts` → `useResize` (preserve the TASK-085 `unload()`-on-
      resize behavior that re-arms `Ultimate`)
- [x] Remove the `selfRef` shim from `Reader/index.tsx`
- [x] 9 snapshots unchanged; 458 tests pass; `tsc --noEmit` clean
- [x] **Browser QA (thorough)**: cold load, chapter navigation (fwd/back,
      keyboard), page turns, and window resize/fullscreen all behave as before —
      run the full `SPREAD-CLUSTER-QA.md` checklist to confirm no regression
- [x] Commit; update `PLAN.md`; remove `.open`

## Notes

- Highest-risk task in the wave. Strongly prefer landing TASK-095–099 first so
  the rest of the tree is stable and idiomatic before touching the orchestrator.
- **Batching (conventions §3c):** this is the densest batching-sensitive site —
  `loader.ts` (3), `navigation.ts` (7), `resize.ts` update clusters live in
  async/observer callbacks that ran synchronously on React ≤17 hosts but
  auto-batch under 18+. Model each cluster as one atomic transition (`useReducer`
  / functional updaters); do not depend on intermediate renders. If a step truly
  needs a committed DOM between updates, `flushSync` is the documented escape
  hatch — but stop and get it reviewed (none exists today).
- `book.content` global remains for now — it moves into the state layer in the
  TASK-073 → Step 4 work, not here.

## Resolution

- **Design:** the `setState` shim, `stateRef`/`propsRef`, the post-render
  callback-flush effect, all four lifecycle-replacement effects, and Reader's own
  methods (`freeze`, `getTranslateX`, `closeSidebars`, …) **stayed in
  `Reader/index.tsx` unchanged** — that is the batching-sensitive surface (§3c),
  so leaving it byte-identical is what preserves behaviour. Only the three
  modules' function *bodies* moved into hooks.
- `selfRef` (a `this` stand-in with `state`/`props` getters + `.bind(self)`) is
  replaced by `apiRef`, a ref to an assembled `ReaderApi`. Each hook reads
  `stateRef`/`propsRef`/`setState` directly and resolves cross-cutting calls via
  `apiRef.current.<fn>` at call time — this is what breaks the genuine
  navigation ↔ loader cycle without ordering constraints. Reader assembles
  `apiRef.current` from the stable hook callbacks + its own methods each render.
- The 1000ms resize start/end debounce moved from Reader's constructor-equivalent
  into `useResize` (`useMemo`-stable so bind/unbind add and remove the same refs).
- `ReaderInstance` type removed; `ReaderApi` + `ReaderHookDeps` + `SetState` added.
  No new `any`; `tsc --noEmit` clean.
- **No batching change:** every `setState(...)` call site is byte-identical and
  still routed through the same shim, so no §3c regression. `flushSync` not used.
- **Tests:** the three unit suites now drive the hooks via `renderHook` (the
  former fake-`self` splits into `stateRef`/`propsRef`/`setState`/`api`); the
  `handleResizeEnd` cases advance fake timers since that handler is now the
  trailing-edge debounced one. `index.test.jsx` mocks the three hooks and
  captures `useLoader`'s deps so the `getSlug` test can drive `setState`. 71
  suites / 458 tests / 9 snapshots unchanged.
- **Browser QA (SPREAD-CLUSTER-QA flow):** cold load shows then hides the spinner
  after settle; page turns advance one spread at a time; chapter navigation loads
  new content; window resize and rapid repeated resize both recover (no infinite
  spinner — TASK-085 preserved) and re-measure to the new width. Only console
  noise is the pre-existing `NaN ... height` warning (a *height* value unrelated
  to this change; documented in [[TASK-098]]/[[TASK-099]], reproduces on base).
- Related: [[TASK-094]] (conventions), [[TASK-085]] (resize `unload()` behavior
  to preserve), [[TASK-073]] (state migration — `book.content` follow-up).
