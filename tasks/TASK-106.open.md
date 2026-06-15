# TASK-106: Migrate state off Redux → useSyncExternalStore (Step 4 execution)

**Status:** in progress
**Feature:** React 19 (reader-react)
**Phase:** Modernization — Step 4 (state migration)
**Priority:** medium
**Model:** Sonnet 4.6 per slice (mechanical, snapshot-guarded); escalate the two
hot slices (`view`, `viewerSettings`) and the `book.content` move to Opus
(re-render assessment + render-purity judgment, §3c/§3e).
**Depends on:** [[TASK-073]] (the research/plan this executes). Best done after
Steps 1–2 (complete) so components are already functional.

> **Binding plan:** [`STATE-MIGRATION-PLAN.md`](../packages/b-ber-reader-react/STATE-MIGRATION-PLAN.md).
> Read it and [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> (§0 behavior preservation, §1 gate, §3c batching, §3e `useSyncExternalStore`)
> first.

## Description

Execute the state-management migration recommended by TASK-073: replace plain
Redux + `redux-thunk` + `connect()` with a tiny hand-rolled external store read
via `useSyncExternalStore`, plus a stable ref-backed `ReaderApiContext` for the
imperative methods. Drop `react-redux`, `redux`, `redux-thunk`, and
`redux-mock-store`. Behavior must be identical at every step.

## Subtasks

- [x] Scaffold `createReaderStore` + `StoreContext`/`StoreProvider` + `useStore`
      (via `useSyncExternalStoreWithSelector`) + a `renderWithStore` test helper;
      seed from merged `readerSettings` props; run **alongside** Redux initially
- [x] Migrate cold slices: `readerSettings` → `markers` (also drop the unused
      `markers` subscription in `Spread`, [[TASK-068]] L4). `markers` dead
      subscription removed from `Marker`; `readerSettings` moved to the store
      (App writer + Link/Spread/Controls/Frame/Sidebar×3/Reader/use-node-position
      readers), tests migrated to `renderWithStore`/`renderWithStores`.
- [ ] Migrate warm slices: `userInterface`, `readerLocation`; port
      `setInitialSearchParams` to a snapshot-reading function; **delete the dead
      `viewerSettings.load`/`save` thunks**
- [ ] Migrate hot slices: `view`, then `viewerSettings` — **with a re-render
      check** proving parity with the `connect` baseline (Profiler/render-counter)
- [ ] Move `book.content` into the store as `{ spineItemURL, node }` (atomic
      write); remove the `key`-prop remount hack; `BookContent` becomes a pure
      `useStore` read
- [ ] Introduce `ReaderApiContext` (stable, ref-backed) for `freeze`/`navigate*`/
      `loadSpineItem`; collapse `reader-context` (stable methods → API context,
      reactive `spreadIndex`/`lastSpread` → store); decide `Reader` local-state
      (`spine`/`currentSpineItem*`) placement
- [ ] Remove `connect()` from all 14 + 3 components as their slices migrate;
      tighten the [[TASK-032]] injected-`any`/`BoundActions` types as they go
- [ ] Delete `react-redux`/`redux`/`redux-thunk`/`redux-mock-store`, the
      `Provider`, reducers, and thunk plumbing once unreferenced
- [ ] 9 snapshots unchanged; tests pass (rewrite redux-`Provider` tests to
      `renderWithStore`); `tsc --noEmit` clean — **at every commit**
- [ ] **Browser QA**: full `SPREAD-CLUSTER-QA.md` flow (load/spinner, page turns,
      chapter nav, resize recovery) — state migration must not regress timing
- [ ] One slice per commit; update `PLAN.md`; remove `.open`

## Notes

- See `STATE-MIGRATION-PLAN.md` for the inventory, the target store/context
  design, the re-render rationale, and the slice ordering. This task implements
  it; deviations from the plan should be recorded back in that doc.
- **Biggest footgun:** `useSyncExternalStore` selectors must return stable
  values or it loops — use `useSyncExternalStoreWithSelector` + equality fn for
  derived objects.
- The test surface is large (many suites use `createTestStore` + RTL `Provider`);
  migrate tests slice-by-slice alongside the source, keeping the 458/9 gate green.
- Related: [[TASK-073]] (research), [[TASK-032]] (type debt this dissolves),
  [[TASK-094]] (conventions), [[TASK-105]] (colocation — sequence after this).
