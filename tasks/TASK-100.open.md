# TASK-100: Remove the selfRef shim — extract navigation/loader/resize into hooks

**Status:** not started
**Feature:** React 19 (reader-react)
**Scope:** b-ber-reader-react
**Phase:** Modernization — Step 2 (HOC→hooks / finalize functional Reader)
**Priority:** high
**Model:** Opus — the most entangled change in the migration. `navigation.ts`,
`loader.ts`, and `resize.ts` still use `this.state`/`this.props`/`this.setState`
through a `selfRef` shim; untangling that into hooks while preserving the exact
load/navigation/resize behavior (including the spinner sequence) is high-judgment.

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> first. This is the change most able to reintroduce the spread-cluster spinner
> bugs — verify the load/resize sequences against `SPREAD-CLUSTER-QA.md`.

## Description

`Reader/index.tsx` is already a functional component, but it keeps a `selfRef`
shim so the extracted modules `navigation.ts`, `loader.ts`, and `resize.ts` can
continue to use `this.*`. Convert those modules into custom hooks
(e.g. `useNavigation`, `useLoader`, `useResize`) that take the real state/refs/
dispatch they need, and remove the shim. This is the long-standing Phase-3
leftover and the last major non-idiomatic pattern in the orchestrator.

## Subtasks

- [ ] Map the `selfRef` surface: enumerate every `this.state`/`this.props`/
      `this.setState`/`this.<method>` access in navigation/loader/resize
- [ ] Extract `loader.ts` → `useLoader` (OPF/NCX fetch, spine parse,
      `book.content` population); preserve the load/spinner ordering exactly
- [ ] Extract `navigation.ts` → `useNavigation` (page + chapter navigation)
- [ ] Extract `resize.ts` → `useResize` (preserve the TASK-085 `unload()`-on-
      resize behavior that re-arms `Ultimate`)
- [ ] Remove the `selfRef` shim from `Reader/index.tsx`
- [ ] 9 snapshots unchanged; 458 tests pass; `tsc --noEmit` clean
- [ ] **Browser QA (thorough)**: cold load, chapter navigation (fwd/back,
      keyboard), page turns, and window resize/fullscreen all behave as before —
      run the full `SPREAD-CLUSTER-QA.md` checklist to confirm no regression
- [ ] Commit; update `PLAN.md`; remove `.open`

## Notes

- Highest-risk task in the wave. Strongly prefer landing TASK-095–099 first so
  the rest of the tree is stable and idiomatic before touching the orchestrator.
- `book.content` global remains for now — it moves into the state layer in the
  TASK-073 → Step 4 work, not here.
- Related: [[TASK-094]] (conventions), [[TASK-085]] (resize `unload()` behavior
  to preserve), [[TASK-073]] (state migration — `book.content` follow-up).
