# TASK-096: Convert the Media subtree to functional components

**Status:** complete (browser QA outstanding — see Notes)
**Feature:** React 19 (reader-react)
**Branch:** `feat/react19-step1-media` (pending merge into `feat/upgrades`)
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

- [x] Convert `MediaControls` and `MediaButtonVolume` (simplest) → functional; verify
- [x] Convert `Iframe` → functional (keep both position HOC wrappers); verify
- [x] Convert `Media` → functional; map `UNSAFE_componentWillMount` carefully
      (§3a) and `UNSAFE_componentWillReceiveProps` → `useEffect`; `this.context`
      → `useContext`; verify media plays + controls work
- [x] Convert `Vimeo` → functional (same care as Media); verify Vimeo playback
- [x] 9 snapshots unchanged + 458 tests pass after each; `tsc --noEmit` clean
- [ ] **Browser QA**: a project with audio, video, Vimeo, and iframe media —
      playback, controls, and positioning unchanged *(outstanding — needs a
      human; see Notes)*
- [x] One commit per component; update `PLAN.md`; remove `.open`

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

## Completion notes (2026-06-14)

All five components are functional; one commit each on
`feat/react19-step1-media`. `npm test` green (71 suites / 458 tests / 9
snapshots unchanged), `tsc --noEmit` clean.

Decisions worth a reviewer's eye (the conversions that took judgment, not
transcription):

- **Media → `useMediaPlayer` hook (not inline).** Media is logic-heavy /
  view-light: ~20 imperative methods over `elemRef` + state, and its tests were
  white-box (grabbed the class instance via `ref`, read `instance.state`, called
  `instance.setState`/methods). A functional component exposes no instance, so
  those ~37 tests could not survive a literal conversion. Extracting the
  controller into `useMediaPlayer` let the tests translate **1:1**
  (`instance.x` → `player.current.x`) via a small render harness, preserving the
  exact granular coverage (displayTime, fullscreen vendor fallbacks, onCanPlay,
  updateControlsUI scheduling) that a DOM-driven rewrite would have eroded. This
  is slightly more than §5's "no reorg" invites — justified by the test-fidelity
  win and flagged here per the task's review ask. The other four stayed plain
  inline-functional with their tests untouched.
- **`this.state` behind a ref.** The class read `this.state` live inside methods
  and used `setState(partial, cb)` callbacks for DOM writes. The hook mirrors
  state in a ref (live reads) and writes the DOM with the computed value
  directly — no dependence on batching/commit timing (§3c).
- **`UNSAFE_componentWillReceiveProps` timing (Vimeo).** First written as a
  `useEffect`; tests caught that the effect runs *after* paint while the old
  lifecycle ran *before* commit, so the play-state update landed a frame late.
  Rewrote it as a **render-phase update** (React's "adjust state while
  rendering" pattern) keyed on spread/view-loaded, which applies synchronously
  like the lifecycle and skips mount + internal setState. Media's equivalent is
  an effect because it has a real side effect (registering a one-shot `canplay`
  listener), with cleanup added per §3d.
- **Test harness pinning.** `Iframe`/`Vimeo` tests use
  `jest.resetModules()` + dynamic `import()` to re-evaluate the module-level
  Chrome-81 check. Once these components use hooks, that pattern handed them a
  second React copy (null hook dispatcher → crash) and, for Vimeo, a second
  `ReaderContext` object (Provider/`useContext` mismatch → default value). Both
  are identity-singletons in production, so the test files now pin one instance
  of each across resets. Assertions are unchanged.

**Browser QA still required** (cannot be done from CI/agent): load a project
with audio, video, Vimeo, and iframe media and confirm playback, controls, and
positioning are unchanged — especially autoplay-on-spread-navigation for Media
and Vimeo, which is the timing-sensitive path above.
