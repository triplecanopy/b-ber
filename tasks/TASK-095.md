# TASK-095: Convert leaf class components to functional

**Status:** not started
**Feature:** React 19 (reader-react)
**Scope:** b-ber-reader-react
**Phase:** Modernization — Step 1 (class→functional)
**Priority:** medium
**Model:** Sonnet 4.6 — mechanical conversions with a clear pattern and strong
test/snapshot coverage. Small, isolated diffs.

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> (TASK-094) first. Follow §3 (class→functional) and §1 (verification gate).

## Description

Convert the three self-contained leaf class components to functional components,
behavior-preserving. These are the warm-up wave: small, isolated, no HOC
authoring. Each stays wrapped by any existing HOC/`connect()` (convert the body
only — see conventions §3b).

Targets:

- `src/components/Footnote.tsx` — simple class, no `UNSAFE_`.
- `src/components/Marker.tsx` — class, no `UNSAFE_`; consumes `withNodePosition`
  (keep the HOC wrapper for now; it's converted in TASK-099).
- `src/components/Sidebar/SidebarSettings.tsx` — class with
  `UNSAFE_componentWillReceiveProps` → `useEffect` on the relevant prop
  (conventions §3).

## Subtasks

- [ ] Convert `Footnote` → functional; `npm test` + snapshots + typecheck green
- [ ] Convert `Marker` → functional (keep `withNodePosition` wrapper); verify
- [ ] Convert `SidebarSettings` → functional (`UNSAFE_componentWillReceiveProps`
      → `useEffect`); verify
- [ ] Confirm 9 snapshots unchanged and 458 tests still pass after each
- [ ] One commit per component; update `PLAN.md`; remove `.open`

## Notes

- No `UNSAFE_` ordering concern for Footnote/Marker. SidebarSettings only reacts
  to a prop change, so `useEffect` keyed on that prop is the direct equivalent.
- Marker's position still comes from `withNodePosition` here — do not convert
  that HOC in this task.
- Related: [[TASK-094]] (conventions), [[TASK-099]] (position HOCs → hooks).
