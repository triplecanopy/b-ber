# TASK-095: Convert leaf class components to functional

**Status:** complete
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

- [x] Convert `Footnote` → functional; `npm test` + snapshots + typecheck green
- [x] Convert `Marker` → functional (keep `withNodePosition` wrapper); verify
- [x] Convert `SidebarSettings` → functional (`UNSAFE_componentWillReceiveProps`
      → `useEffect`); verify
- [x] Confirm 9 snapshots unchanged and 458 tests still pass after each
- [x] One commit per component; update `PLAN.md`; remove `.open`

## Notes

- No `UNSAFE_` ordering concern for Footnote/Marker. SidebarSettings only reacts
  to a prop change, so `useEffect` keyed on that prop is the direct equivalent.
- Marker's position still comes from `withNodePosition` here — do not convert
  that HOC in this task.
- Related: [[TASK-094]] (conventions), [[TASK-099]] (position HOCs → hooks).

## Completion notes

- `Footnote`: `useState`/`useRef` for content/visible/footnote id and the two
  DOM refs. `componentWillUnmount`'s `document.removeEventListener('click', ...)`
  is preserved via a `useEffect` cleanup; a `boundListeners` ref tracks the
  exact `click`/`mousemove` listener functions bound by `showFootnote` so
  `hideFootnote`/unmount remove the same references (closures are recreated
  each render). `connect()` wrapper unchanged.
- `Marker`: pure mechanical conversion, no state/lifecycle. `withNodePosition`
  and `connect()` wrappers unchanged (per conventions §3b, deferred to
  TASK-099).
- `SidebarSettings`: `fontSizeMin`/`Max`/`Step` were state but never changed —
  hoisted to module-level consts. `UNSAFE_componentWillReceiveProps` →
  `useEffect` keyed on `viewerSettings.fontSize`, using a functional
  `setFontSize` updater (per §3c.2) to avoid a stale-state comparison.
- All three: 71 suites / 458 tests / 9 snapshots unchanged; `tsc --noEmit`
  clean. No browser QA needed (pure leaf components per §1.4).
- Branch: `feat/react19-step1-leaves` (off `feat/upgrades`), one commit per
  component.
