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
- [x] Migrate warm slices: `userInterface`, `readerLocation`; port
      `setInitialSearchParams` to a snapshot-reading function; **delete the dead
      `viewerSettings.load`/`save` thunks**. Store-backed action bundles in
      `store/userInterfaceActions.ts` + `store/readerLocationActions.ts`
      (injected into Reader `propsRef`); App is now connect-free.
- [x] Migrate hot slices: `view`, then `viewerSettings` — **with a re-render
      check** proving parity with the `connect` baseline (Profiler/render-counter).
      Store bundles in `store/viewActions.ts` + `store/viewerSettingsActions.ts`;
      Ultimate's settle consolidated to one atomic `view` write (§3c). Render-
      count parity test in `__tests__/store/useStore.parity.test.jsx` proves
      selector-level bailout. After this, no component uses connect/redux.
      **Browser QA still pending.**
- [x] Move `book.content` into the store as `{ spineItemURL, node }` (atomic
      write via `store/contentActions.ts`); `BookContent` self-keys on
      `spineItemURL` (a legitimate chapter-change remount that re-arms Ultimate),
      dropping the prop-threaded `key` hack; pure `useStore` read.
- [x] Introduce `ReaderApiContext` (stable, ref-backed) and collapse
      `reader-context`. **As built** (deviations recorded in
      `STATE-MIGRATION-PLAN.md §3`): `ReaderApiContext` carries the methods deep
      descendants actually consume (`getTranslateX`, `navigateToChapterByURL`,
      `getSpineItemByAbsoluteUrl`) with a never-changing identity, so Link/
      SpreadFigure/Layout/`useNodePosition` stop re-rendering on spread changes;
      `freeze`/`navigate*`/`loadSpineItem` stay internal (`apiRef`/Controls
      props). `reader-context` slims to the reactive `{ spreadIndex, lastSpread }`
      consumed only by Vimeo/`useMediaPlayer`. `spreadIndex`/`lastSpread` were
      **kept as `Reader` local state** (not moved to the store) because they are
      written atomically with the rest of `Reader`'s navigation state in single
      `setState` calls — resolving the `Reader` local-state placement decision:
      all orchestration state stays local, the store holds only cross-cutting
      slices.
- [x] Remove `connect()` from all components (no component uses
      connect/useSelector/useDispatch anymore; Reader is plain functional).
- [x] Delete `react-redux`/`redux`/`redux-thunk`/`redux-mock-store`, the
      `Provider`, reducers, actions, action-type constants, and thunk plumbing.
- [x] 9 snapshots unchanged; tests pass (redux `Provider` tests rewritten to
      `renderWithStore`; reducer/action tests deleted with their code);
      `tsc --noEmit` clean — at every commit.
- [ ] **Browser QA**: full `SPREAD-CLUSTER-QA.md` flow (load/spinner, page turns,
      chapter nav, resize recovery) — covers hot slices + book.content remount.
      Cold/warm QA'd (bugs fixed). Hot + book.content **still pending**.
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
