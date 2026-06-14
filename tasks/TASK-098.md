# TASK-098: Convert measurement HOCs to hooks

**Status:** not started
**Feature:** React 19 (reader-react)
**Scope:** b-ber-reader-react
**Phase:** Modernization — Step 2 (HOC→hooks)
**Priority:** medium
**Model:** Sonnet 4.6 — single-consumer HOCs with a clear hook pattern (§4).
**Depends on:** TASK-095/096/097 (each HOC's consumers must be functional first).

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> §4 (HOC→hook) first.

## Description

Convert the two measurement HOCs to hooks. Each has exactly one consumer, so the
swap is mechanical once that consumer is functional.

- `src/lib/with-dimensions.tsx` → `useDimensions` — consumer: `Layout.tsx`.
  Has `UNSAFE_componentWillMount`; the hook measures the viewport and dispatches
  `viewerSettings` (preserve the same dispatch timing — conventions §3a).
- `src/lib/with-navigation-actions.tsx` → `useNavigationActions` — consumer:
  `Controls.tsx`. Wraps navigation action dispatchers.

Per §4: add the hook, call it in the (functional) consumer, remove the `withX`
wrapper, delete the HOC, and replace its injected-prop `any` types (TASK-032
type debt) with the hook's real return type.

## Subtasks

- [ ] `with-navigation-actions` → `useNavigationActions`; update `Controls`;
      remove wrapper; delete HOC; type the return
- [ ] `with-dimensions` → `useDimensions`; update `Layout`; preserve the
      viewerSettings dispatch timing; remove wrapper; delete HOC; type the return
- [ ] 9 snapshots unchanged; 458 tests pass; `tsc --noEmit` clean
- [ ] **Browser QA**: viewport measurement still drives layout on load + resize;
      nav controls still work
- [ ] One commit per HOC; update `PLAN.md`; remove `.open`

## Notes

- `with-last-spread-index` is already functional — not in scope here.
- Related: [[TASK-094]] (conventions), [[TASK-099]] (position HOCs).
