# TASK-099: Convert position HOCs to hooks

**Status:** not started
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

- [ ] `with-iframe-position` → `useIframePosition`; update `Vimeo`/`Iframe`;
      remove wrappers; delete HOC; type the return
- [ ] `with-node-position` → `useNodePosition`; update `Marker`/`Media`/`Vimeo`/
      `Iframe` (+ `process-nodes`/`media` call sites); remove wrappers; delete HOC
- [ ] Migrate the page-width math to `Viewport.getPageWidth` (TASK-084 carry-over)
- [ ] Replace the injected-prop `any` types with the hooks' real return types
- [ ] 9 snapshots unchanged; 458 tests pass; `tsc --noEmit` clean
- [ ] **Browser QA**: marker positioning (a project with markers/inline nodes)
      and media positioning unchanged; verify at an odd window width (fractional
      `paddingLeft`) per the TASK-084 geometry note
- [ ] One commit per HOC; update `PLAN.md`; remove `.open`

## Notes

- After this + TASK-098, no class HOCs remain and `with-*` are all hooks.
- Marker positioning is the sensitive surface (the `getPageWidth` change); QA it
  deliberately — this is why TASK-084 deferred it here.
- Related: [[TASK-084]] (getPageWidth consolidation — carry-over closed here),
  [[TASK-094]] (conventions), [[TASK-032]] (the `any` cluster this dissolves).
