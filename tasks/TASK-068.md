# TASK-068: Phase 1 housekeeping

**Status:** complete
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

- [x] Remove all remaining commented-out dead code (`navigation.js` `deferredCallback` blocks, `Reader/index.jsx`, `loader.js`) — current tree: `navigation.ts` was already clean (no `deferredCallback` blocks, confirmed by re-reading the file); removed a dead commented destructure in `Reader/index.tsx`, a stray disabled `addEventListener` line in `resize.ts`, and disabled `transition`/positioning lines in `Layout.tsx`'s `getLeafStyles`
- [x] Rename `bindResizeHandlers` → `removeResizeHandlers` and `unbindResizeHandlers` → `addResizeHandlers` in `resize.js` and all call sites in `Reader/index.jsx` (IMPROVEMENT_PLAN H4) — current tree: targets `resize.ts`'s `useResize` hook (per the stale-subtasks note); confirmed the inversion was still present, renamed the functions, updated the `ReaderApi` type, the call sites in `Reader/index.tsx`, and both test files (`resize.test.js`, `Reader/index.test.jsx`)
- [x] Add a top-level `ErrorBoundary` component wrapping `Frame` (and ideally `BookContent`) with a meaningful error message and retry button (IMPROVEMENT_PLAN M1) — added `src/components/ErrorBoundary.tsx` (class component — the one documented exception to "no new class components", since `getDerivedStateFromError`/`componentDidCatch` have no hook equivalent), wraps `<Layout>` (which renders `BookContent`) inside `Frame.tsx`; added to the components barrel and a dedicated test file
- [x] Remove `markers` from `Spread`'s Redux `connect` call — **N/A**: Redux was fully removed package-wide in TASK-106. `Spread.tsx` has no `connect()` call of any kind and never subscribes to `markers` — confirmed by reading the full file. Nothing to remove.
- [x] Replace random ID generation in `Spread.jsx` with a deterministic approach (IMPROVEMENT_PLAN L3) — replaced `(Math.random() + 1).toString(36).substring(7)` with React's `useId()`. The package already requires React 18+ (the built-in store uses `useSyncExternalStore`), so `useId` is consistent with the existing baseline. No other code reads this id.
- [x] Add a comment documenting the verso/recto multiplier rationale in `Spread.jsx` (IMPROVEMENT_PLAN M6) — already substantially documented in the current tree (a prior pass added a detailed comment block above `const verso = …` / `const multiplier = …` and in the `spreadContextValue` memo explaining the column-position math); reviewed and left as-is, no further changes needed
- [x] Remove the dead `debug` block in `src/components/Marker.tsx` — removed `const debug = false`, `debugMarkerStyles`, and the `if (debug)` branch. Confirmed `markerStyles` was never read by the rendered JSX even when `debug` was true (no `style={markerStyles}` anywhere) — the whole block was dead computation, not just unreachable in this build.
- [x] Fix the dangling `IMPROVEMENT_PLAN.md` references in code comments — found and fixed 8 occurrences (not ~10) across all 5 named files: `loader.ts` (1), `Ultimate.tsx` (1), `Reader/index.tsx` (3: H5, C5, H4), `resize.ts` (2: TODO + NOTE, both resolved as part of the rename), `with-last-spread-index.tsx` (1). All repointed to "PLAN.md history" or dropped.
- [x] Modernize the last render-prop context consumer: `SpreadFigure.tsx` — converted `<SpreadContext.Consumer>{({ left }) => …}</SpreadContext.Consumer>` to `const { left } = useContext(SpreadContext)`, matching the `useContext` calls already used for the other two contexts in the same component. `SpreadContext.Provider` in `Spread.tsx` left as-is per the subtask note.
- [x] Wrap `Layout.tsx`'s render-body `debounce(onResizeDone, …)` in `useMemo`/`useCallback` — wrapped the debounce in `useMemo` (deps `[]`, matching the mount-only resize effect), routed through a ref (`onResizeDoneRef`) so the stable debounced function still calls the latest closure. The resize effect's deps (`[]`) and cleanup are unchanged; the existing `Layout.test.jsx` resize-handling tests (mount/unmount/debounced-call assertions) all still pass unmodified.
- [x] `navigateToElementById` (`Reader/navigation.ts`) — documentation only, no behavior change: explained why `.bber-controls__header`/`#frame` are hardcoded (the function has no component instance/ref of its own) and what the `/2` in the spread-index math represents (column index → spread index, assuming the 2-column desktop/tablet layout per `constants/index.ts`).
- [x] Run `npm test` and confirm all existing tests still pass — 62 suites / 406 tests / 9 snapshots, all green (see Notes for the count change from the AGENTS.md-documented baseline)
- [ ] Update `PLAN.md` — left to the orchestrator per worktree bookkeeping convention (AGENTS.md "Dispatching subagents in isolated worktrees")

Also removed, as a closely-related dead-code item found during this pass (not separately listed above but squarely within the task's intent): the unused `src/lib/custom-prop-types.ts` module and its test, which had no consumers anywhere in the package outside its own test file (explicitly called out in the task header note).

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

### 2026-06-21 — implementation session

Completed on branch `worktree-agent-ae7172b03f24607f8` (worktree subagent;
pinned to `feat/upgrades` before starting, per AGENTS.md). Nine commits, one
logical change each — dead code + dangling doc refs, resize handler rename,
unused custom-prop-types removal, Marker debug block removal, SpreadFigure
Consumer→useContext, Spread useId, Layout debounce memoization fix,
navigation.ts documentation, ErrorBoundary feature.

- **Test baseline:** this package's `AGENTS.md` quality-gates section states
  "71 suites, 458 tests" as of the TS conversion; the actual baseline at the
  start of this session was 62 suites / 408 tests / 9 snapshots. That
  discrepancy predates this task and is out of scope to fix here (no source
  change would close it — it looks like the AGENTS.md figure was never
  updated after a later removal). Ending state: 62 suites / 406 tests / 9
  snapshots (one suite removed — `custom-prop-types.test.js` deleted with its
  module; one suite added — `ErrorBoundary.test.jsx`; net -2 tests from the
  custom-prop-types test removal, +3 from the new ErrorBoundary tests).
  Snapshots unchanged at 9 throughout (ErrorBoundary's tests use explicit
  assertions, not `toMatchSnapshot`).
- **Quality gates passed:** `npm test` green throughout (verified after every
  commit, not just at the end); `npx tsc --noEmit` clean; `biome check
  packages/b-ber-reader-react` clean for every file touched this session. Six
  pre-existing biome *warnings* (not errors) remain in `DocumentPreProcessor.ts`,
  `DocumentProcessor.ts`, `Media/useMediaPlayer.ts`, and `__tests__/config.test.js`
  — confirmed via `git log`/`git blame` that they predate this session (last
  touched in `aaea6c26`, an earlier TS-conversion commit) and are outside this
  task's scope (MIGRATION-CONVENTIONS §5).
- **Judgment calls:**
  - Used `React.useId()` rather than another deterministic scheme (e.g. a
    module-level counter) for `Spread.tsx`'s id — it's the idiomatic React 18+
    primitive for exactly this purpose and the package's store already
    requires React 18+ (`useSyncExternalStore`).
  - Added `ErrorBoundary` to the `src/components/index.ts` barrel (and updated
    the barrel's smoke test) since every other top-level component is exported
    there; the task didn't explicitly require this but it's consistent with
    the existing convention and makes the component independently testable/
    importable.
  - Did not introduce a CSS Module for the ErrorBoundary fallback UI (used
    inline styles instead) — avoids scope creep into the CSS-modules
    migration (TASK-076) and matches the user's standing preference for fewer
    build-surface dependencies.
  - Left the verso/recto multiplier documentation subtask as a no-op: a prior
    pass (predating this session) had already added a thorough comment block
    covering the rationale; re-reading it confirmed it was substantially
    complete, so no further edits were made.
  - `PLAN.md` intentionally not touched — left to the orchestrator, per the
    worktree-subagent bookkeeping convention in AGENTS.md.
