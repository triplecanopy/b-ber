# TASK-073: Redux modernization — Redux Toolkit or Context API

**Status:** not started
**Phase:** Modernization — Phase 5
**Priority:** low

## Description

Modernize state management. The current setup uses plain Redux + `redux-thunk` with
manually written action creators and reducers. Two paths are available:

**Option A — Redux Toolkit:** Migrate to `createSlice` + `createAsyncThunk`. This is
a drop-in modernization that preserves the Redux architecture while eliminating
boilerplate and providing built-in Immer immutability.

**Option B — Context + useReducer:** Replace Redux entirely for simpler state slices.
Some state (viewer settings, UI flags) is simple enough to live in React context.
Complex cross-component state (spine, current chapter, navigation) may still benefit
from a store.

## Current Redux slices

| Slice            | Description                                            |
| ---------------- | ------------------------------------------------------ |
| `readerSettings` | Book URL, manifest URL, static config                  |
| `readerLocation` | Current slug, search params, hash                      |
| `userInterface`  | Spinner, sidebar, marker visibility, handleEvents      |
| `view`           | Loaded state, lastSpreadIndex, spreadIndex             |
| `viewerSettings` | Computed layout dimensions (padding, column gap, etc.) |
| `markers`        | User bookmarks                                         |

## Subtasks

- [ ] Decide on Option A vs Option B (discuss with user before starting)
- [ ] Migrate `userInterface` slice (simplest, pure UI flags)
- [ ] Migrate `viewerSettings` slice
- [ ] Migrate `view` slice
- [ ] Migrate `readerLocation` slice
- [ ] Migrate `readerSettings` slice
- [ ] Migrate `markers` slice
- [ ] Move `spine`, `currentSpineItem`, `currentSpineItemIndex` out of Reader local state and into store (IMPROVEMENT_PLAN Phase 5)
- [ ] Remove `react-redux` `connect()` HOCs; replace with `useSelector` / `useDispatch`
- [ ] Run `npm test`
- [ ] Update `PLAN.md`

## Notes

- Do not start this task until TASK-072 (TypeScript) is at least partially complete.
  Typed slices are significantly easier to migrate correctly.
- The `book.content` module-level global (IMPROVEMENT_PLAN C4) should be moved into
  Redux state as part of this migration — it is the last major bypass of the React
  rendering pipeline.
