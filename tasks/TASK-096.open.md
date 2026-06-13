# TASK-096: Convert the Media subtree to functional components

**Status:** not started
**Feature:** React 19 (reader-react)
**Scope:** b-ber-reader-react
**Phase:** Modernization — Step 1 (class→functional)
**Priority:** medium
**Model:** Sonnet 4.6 for the wave — but `Media` and `Vimeo` are the tricky
members (`UNSAFE_componentWillMount` + `this.context` + media helper); if their
load/playback ordering proves subtle, escalate those two to Opus. The Controls
(`MediaControls`, `MediaButtonVolume`) are straightforward.

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> first. Pay special attention to §3a (`UNSAFE_componentWillMount` runs after
> first paint now — preserve any render-blocking setup ordering).

## Description

Convert the audio/video subtree to functional components, behavior-preserving.
These components keep their `withNodePosition` / `withIframePosition` wrappers
for now (converted in TASK-099) and their `connect()` wrappers (conventions §3b).

Targets:

- `src/components/Media/Media.tsx` — `UNSAFE_componentWillMount` +
  `UNSAFE_componentWillReceiveProps` + `this.context`; uses `helpers/media.ts`.
- `src/components/Media/Vimeo.tsx` — same shape as Media (UNSAFE_ ×2 + context).
- `src/components/Media/Iframe.tsx` — consumes `withNodePosition` +
  `withIframePosition`.
- `src/components/Media/Controls/MediaControls.tsx` — leaf-ish.
- `src/components/Media/Controls/MediaButtonVolume.tsx` — leaf-ish.

## Subtasks

- [ ] Convert `MediaControls` and `MediaButtonVolume` (simplest) → functional; verify
- [ ] Convert `Iframe` → functional (keep both position HOC wrappers); verify
- [ ] Convert `Media` → functional; map `UNSAFE_componentWillMount` carefully
      (§3a) and `UNSAFE_componentWillReceiveProps` → `useEffect`; `this.context`
      → `useContext`; verify media plays + controls work
- [ ] Convert `Vimeo` → functional (same care as Media); verify Vimeo playback
- [ ] 9 snapshots unchanged + 458 tests pass after each; `tsc --noEmit` clean
- [ ] **Browser QA**: a project with audio, video, Vimeo, and iframe media —
      playback, controls, and positioning unchanged
- [ ] One commit per component; update `PLAN.md`; remove `.open`

## Notes

- The position HOC props are still injected by `withNodePosition` /
  `withIframePosition` in this task; do not convert those HOCs here (TASK-099).
- `helpers/media.ts` is shared logic — convert components to *use* it as-is; do
  not refactor the helper.
- **Batching (conventions §3c):** `Media`/`Vimeo` have multiple state updates in
  `UNSAFE_componentWillMount`/`UNSAFE_componentWillReceiveProps` (async/context
  paths). These coalesce under React 18+ auto-batching but ran synchronously on
  ≤17 hosts. Don't rely on render count/ordering — prefer one `useReducer` for
  the cluster and functional updaters; this is the "escalate to Opus" trigger.
- Related: [[TASK-094]] (conventions), [[TASK-099]] (position HOCs → hooks).
