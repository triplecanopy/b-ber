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
- [ ] Remove the dead `debug` block in `src/components/Marker.tsx` (`const debug = false` + `debugMarkerStyles` + `if (debug)`) — ~1/3 of the component is unreachable dev code
- [ ] Fix the **dangling `IMPROVEMENT_PLAN.md` references** in code comments (~10 across `Ultimate.tsx`, `Reader/index.tsx`, `Reader/loader.ts`, `Reader/resize.ts`, `with-last-spread-index.tsx`): the file was deleted in commit `9ef8fbbc` (consolidated into `PLAN.md`/`AGENTS.md`) and the bug IDs it used (`H4`/`H5`/`C5`/`M2`/`L2`) no longer resolve anywhere. Either repoint to the surviving doc + ID or drop the reference.
- [ ] Modernize the last render-prop context consumer: `SpreadFigure.tsx` reads `SpreadContext` via `<SpreadContext.Consumer>` (`SpreadFigure.tsx:21`) while already using `useContext` for the reader contexts — switch it to `const { left } = useContext(SpreadContext)`. Behavior-identical, purely idiomatic. (`SpreadContext.Provider` in `Spread.tsx` stays — it passes per-spread positional data down a subtree, correctly a context.) **Lifted from the superseded TASK-105.**
- [ ] Wrap `Layout.tsx`'s render-body `debounce(onResizeDone, …)` (~line 196) in `useMemo`/`useCallback` so it isn't reallocated every render (latent footgun; harmless today because the resize effect has `[]` deps). **From the known-issues audit, 2026-06-21.**
- [ ] `navigateToElementById` (`Reader/navigation.ts`): the hardcoded selectors (`.bber-controls__header`, `#frame`) + the `/2` spread divisor are thinly documented — either improve the comment or leave a behavior probe. **From the known-issues audit, 2026-06-21.**
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
- **Stale subtasks (predate the TS + functional conversion):** the `resize.js`
  rename subtask now targets `resize.ts`'s `useResize` (the bind/unbind names are
  still inverted there — the [[TASK-100]] conversion preserved them as-is); the
  `.jsx` paths are now `.tsx`. Re-confirm each against the current tree before
  acting.
