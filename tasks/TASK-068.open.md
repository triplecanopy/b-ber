# TASK-068: Phase 1 housekeeping

**Status:** not started
**Feature:** React 19 (reader-react)
**Phase:** Modernization — Phase 1
**Priority:** medium
**Model:** Sonnet 4.6 — low-risk, mechanical cleanup (dead code, renames,
ErrorBoundary) guarded by the test suite.

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> first — the verification gate (§1) and scope discipline (§5) apply.
> (Dead code to remove includes the unused `src/lib/custom-prop-types.ts`.)

## Description

Clean up the codebase without changing any behaviour. These are low-risk, high-clarity
improvements that make the code easier to maintain and set a clean baseline for
subsequent phases.

## Subtasks

- [ ] Remove all remaining commented-out dead code (`navigation.js` `deferredCallback` blocks, `Reader/index.jsx`, `loader.js`)
- [ ] Rename `bindResizeHandlers` → `removeResizeHandlers` and `unbindResizeHandlers` → `addResizeHandlers` in `resize.js` and all call sites in `Reader/index.jsx` (IMPROVEMENT_PLAN H4)
- [ ] Add a top-level `ErrorBoundary` component wrapping `Frame` (and ideally `BookContent`) with a meaningful error message and retry button (IMPROVEMENT_PLAN M1)
- [ ] Remove `markers` from `Spread`'s Redux `connect` call — it is subscribed but never used, causing unnecessary re-renders on every marker change (IMPROVEMENT_PLAN L4)
- [ ] Replace random ID generation in `Spread.jsx` with a deterministic approach (IMPROVEMENT_PLAN L3)
- [ ] Add a comment documenting the verso/recto multiplier rationale in `Spread.jsx` (IMPROVEMENT_PLAN M6)
- [ ] Run `npm test` and confirm all existing tests still pass
- [ ] Update `PLAN.md`

## Notes

- The naming inversion in `resize.js` is a maintenance trap: the current call sites
  happen to produce correct behaviour because they also compensate for the inverted
  names. Any new call site will do the opposite of what it intends.
- The `ErrorBoundary` should catch render errors in `Frame`/`BookContent` and display
  a fallback rather than a blank screen.
- This task covers Phase 1 only. Phases 2–5 are tracked separately: TASK-069
  (Phase 2 verification), TASK-067/Phase 3 items in PLAN.md, TASK-072 (Phase 4),
  TASK-073 (Phase 5).
