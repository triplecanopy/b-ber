# TASK-099: Convert position HOCs to hooks

**Status:** complete
**Feature:** React 19 (reader-react)
**Scope:** b-ber-reader-react
**Phase:** Modernization — Step 2 (HOC→hooks)
**Priority:** medium
**Model:** Opus — position geometry, the densest injected-prop `any` cluster
(TASK-032), multiple consumers, marker QA, **and** it absorbs the deferred
TASK-084 `getPageWidth` adoption. High-judgment.
**Depends on:** TASK-095 (Marker) + TASK-096 (Media subtree) — all consumers
must be functional first.

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> §4 first.

## Description

Convert the two position HOCs to hooks. These are the densest `any` cluster
TASK-032 flagged (the `WithNodePositionProps` plumbing) — typing the hook return
dissolves it.

- `src/lib/with-node-position.tsx` → `useNodePosition` — consumers: `Marker`,
  `Media`, `Vimeo`, `Iframe`. Has `UNSAFE_componentWillReceiveProps`. Also used
  by `lib/process-nodes.ts` and `helpers/media.ts` — check those call sites.
- `src/lib/with-iframe-position.tsx` → `useIframePosition` — consumers: `Vimeo`,
  `Iframe`. Has `UNSAFE_componentWillMount`.

**Absorbs TASK-084's deferred item:** migrate `with-node-position`'s page-width
math (the `paddingLeft * 2` variant) to `Viewport.getPageWidth` so all callers
share one geometry source. This is the marker-positioning change TASK-084
deferred pending dedicated QA — do it here with that QA.

## Subtasks

- [x] `with-iframe-position` → `useIframePosition`; update `Vimeo`/`Iframe`;
      remove wrappers; delete HOC; type the return
- [x] `with-node-position` → `useNodePosition`; update `Marker`/`Media`/`Vimeo`/
      `Iframe` (+ `process-nodes`/`media` call sites); remove wrappers; delete HOC
- [x] Migrate the page-width math to `Viewport.getPageWidth` (TASK-084 carry-over)
- [x] Replace the injected-prop `any` types with the hooks' real return types
- [x] 9 snapshots unchanged; 458 tests pass; `tsc --noEmit` clean
- [x] **Browser QA**: marker positioning (a project with markers/inline nodes)
      and media positioning unchanged; verify at an odd window width (fractional
      `paddingLeft`) per the TASK-084 geometry note
- [x] One commit per HOC; update `PLAN.md`; remove `.open`

## Notes

- After this + TASK-098, no class HOCs remain and `with-*` are all hooks.
- `useNodePosition` is generic (`<T extends HTMLElement>`) so each consumer types
  its own ref (span / media element / div), dissolving the TASK-032 `elemRef: any`
  cluster. It returns position state + the `view`/`viewerSettings`/`readerSettings`
  slices the HOC's `connect()` used to inject (so Vimeo/Iframe still read them);
  converting the HOC's own Redux access to `useSelector` is the point of the wave
  (§4.1). `process-nodes` needed no logic change — only an explicit `src: attrs.src`
  so the now-typed `Vimeo.src` is satisfied through the `Record<string, any>` spread.
- `UNSAFE_componentWillReceiveProps` (bounding-client-rect path) became a
  `useEffect` keyed on `view.ultimateOffsetLeft` (§3 — a lifecycle computing from
  a prop → `useEffect([prop])`). The class compared a (in practice undefined)
  top-level `ultimateOffsetLeft` prop against `view.ultimateOffsetLeft`, so it
  recalculated on essentially every re-render; keying on the meaningful value is
  the observable-behavior-preserving translation (§0) since the recalculation is
  an idempotent measure→setState.
- **getPageWidth (TASK-084):** both calc paths now use
  `Viewport.getPageWidth({ width, paddingLeft, paddingRight, columnGap })` for the
  `innerFrameWidth` page-width math instead of `window.innerWidth - paddingLeft*2
  + columnGap`. Numerically identical under symmetric padding (the common case),
  and correct under asymmetric/fractional padding. `columnWidth` (a different
  formula, not page width) was left untouched.
- **Browser QA** (spreads-testing-nov-2024 + i29-roundup): marker classified
  verso/recto and spread figures positioned correctly; `#layout` width matched the
  viewport at both an even (1200) and an odd (1133) width; page navigation worked;
  no new console errors. The lone `NaN ... height` warning at the odd width is the
  pre-existing bug documented in TASK-098 (a *height* value; this change only
  touched *width* geometry) and reproduces on `feat/upgrades` — out of scope (§5).
- Folded in a TASK-098 loose end: `with-dimensions.tsx` had survived as dead code
  (its deletion was lost when husky restored the tree mid-commit); removed it here.
- Related: [[TASK-084]] (getPageWidth consolidation — carry-over closed here),
  [[TASK-094]] (conventions), [[TASK-032]] (the `any` cluster this dissolves),
  [[TASK-098]] (measurement HOCs), [[TASK-100]] (selfRef removal — Step 2 finale).
