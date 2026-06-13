# TASK-097: Convert App to a functional component

**Status:** not started
**Feature:** React 19 (reader-react)
**Scope:** b-ber-reader-react
**Phase:** Modernization — Step 1 (class→functional)
**Priority:** medium
**Model:** Opus — `App` has an **async `UNSAFE_componentWillMount`** (manifest
load that runs before first render) plus `connect()`. Getting the load/spinner
ordering right without reintroducing a premature-render is high-judgment.

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> first — especially §3a (the `UNSAFE_componentWillMount` ordering caveat).

## Description

Convert `src/components/App.tsx` (the top-level Redux `Provider` + Reader mount)
from a class to a functional component, behavior-preserving. This is the most
entangled Step-1 conversion and is done last in the class→functional wave.

The crux is `async UNSAFE_componentWillMount()`: it ran before first render.
`useEffect(…, [])` runs after first paint. Preserve the original behavior — gate
render on a ready flag (or initialize synchronously where possible) so the user
never sees a flash of un-initialized UI. Keep `connect()` (conventions §3b).

## Subtasks

- [ ] Map `async UNSAFE_componentWillMount` → an effect + ready-gate that
      preserves the pre-render ordering (no premature render / flash)
- [ ] Convert remaining lifecycle/state/refs per conventions §3
- [ ] Keep `connect()` wrapping; do not switch to `useSelector`/`useDispatch`
- [ ] 9 snapshots unchanged; 458 tests pass; `tsc --noEmit` clean
- [ ] **Browser QA**: cold load of a project — manifest loads, spinner sequence
      and first paint are visually identical to before
- [ ] Commit; update `PLAN.md`; remove `.open`

## Notes

- This removes the last component-level `UNSAFE_*` in the app once Media/Sidebar
  (TASK-095/096) and the HOCs (TASK-098/099) are done.
- Do not fold in the `selfRef` removal (that's TASK-100) or any state-arch change.
- Related: [[TASK-094]] (conventions), [[TASK-100]] (selfRef removal).
