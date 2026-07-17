# TASK-097: Convert App to a functional component

**Status:** complete (browser QA outstanding — see Notes)
**Feature:** React 19 (reader-react)
**Branch:** `feat/react19-step1-app` (pending merge into `feat/upgrades`)
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

- [x] Map `async UNSAFE_componentWillMount` → an effect + ready-gate that
      preserves the pre-render ordering (no premature render / flash)
- [x] Convert remaining lifecycle/state/refs per conventions §3
- [x] Keep `connect()` wrapping; do not switch to `useSelector`/`useDispatch`
- [x] 9 snapshots unchanged; 458 tests pass; `tsc --noEmit` clean
- [ ] **Browser QA**: cold load of a project — manifest loads, spinner sequence
      and first paint are visually identical to before *(outstanding — needs a
      human; see Notes)*
- [x] Commit; update `PLAN.md`; remove `.open`

## Notes

- This removes the last component-level `UNSAFE_*` in the app once Media/Sidebar
  (TASK-095/096) and the HOCs (TASK-098/099) are done.
- Do not fold in the `selfRef` removal (that's TASK-100) or any state-arch change.
- Related: [[TASK-094]] (conventions), [[TASK-100]] (selfRef removal).

## Completion notes (2026-06-14)

One commit on `feat/react19-step1-app`. `npm test` green (71 suites / 458 tests
/ 9 snapshots unchanged), `tsc --noEmit` and Biome clean. After this,
`src/components/` has **no class components**; the only real `UNSAFE_*` left in
the source is `with-dimensions.tsx`'s `UNSAFE_componentWillMount` — an HOC, which
is TASK-098's scope (every other `UNSAFE_` hit is a descriptive comment).

The conversion was simpler than the task's framing feared: **no separate ready
flag was needed.** The class already gated render with
`if (!searchParams || !bookURL) return null`, and those two values are only set
by the async load dispatching `updateSettings` / `setInitialSearchParams` to
redux. So the first paint is `null` whether the load runs in
`UNSAFE_componentWillMount` (pre-render) or in a mount `useEffect` (post-paint) —
there is no window where un-initialized UI could flash. Moving the async body
verbatim into `useEffect(…, [])` (with `this.props` → `props`) preserved the
visible sequence exactly; the existing behavior-based App.test.jsx passed
unchanged. `connect()` kept per §3b.

The load is a genuine one-time app-init side effect; it dispatches idempotent
settings updates and holds no subscriptions, so no cleanup/abort was added
(§3d). StrictMode is not enabled, so the production single-run matches the class.

**Browser QA still required** (cannot be done from CI/agent): cold-load a
project and confirm the manifest load, spinner sequence, and first paint are
visually identical to before.
