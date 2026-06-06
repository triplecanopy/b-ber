# b-ber-reader-react — Project Plan

_Last updated: 2026-06-03 (TASK-006 complete — webpack → Vite migration; build, tests, and dev server verified)_

---

## What This Is

A side-scrolling EPUB viewer built in React + Redux. It renders EPUB content parsed
from OPF/NCX manifests into a CSS `columns`-based layout, using a `translateX`
transform to simulate page-turning. A secondary scroll layout mode serves mobile.

**Key architecture:**

- Entry: `src/index.jsx` → `App.jsx` → `Reader/index.jsx` (functional component)
- Layout engine: `Layout.jsx` wrapped by two HOCs: `withDimensions` and `withLastSpreadIndex`
- Content: parsed from HTML → React via `html-to-react`, written to module-level `book` object
- State: split between Redux (location, UI, viewer settings) and Reader's `useState`
- Stability detection: `Ultimate.jsx` polls `offsetLeft` via `setTimeout` loop to detect
  when layout is stable, then unlocks the UI

---

## Current Status

### Completed work

| Task     | Description                                                                              | Status   |
| -------- | ---------------------------------------------------------------------------------------- | -------- |
| TASK-001 | Reader/index.jsx class → functional component                                            | complete |
| TASK-002 | Post-migration regressions (NavigationFooter crash, double load, error handler)          | complete |
| TASK-003 | Ultimate.jsx modernization (RAF → setTimeout stability loop, functional component)       | complete |
| TASK-004 | withLastSpreadIndex: setInterval → ResizeObserver + MutationObserver                     | complete |
| TASK-005 | Pass 5 fixes (resize zeros, stability timeout, console.log cleanup)                      | complete |
| TASK-006 | Bug 1: loader never hides — fixed via spineItemURL key on BookContent                    | complete |
| TASK-007 | Bug 2: full-bleed spreads out of sync — fixed via viewerSettingsRef + sub-pixel rounding | complete |

### Open tasks

| Task     | Description                                                 | Priority |
| -------- | ----------------------------------------------------------- | -------- |
| TASK-008 | Fix remaining bugs: chapters re-render, keyboard navigation | complete |
| TASK-009 | Phase 1 housekeeping: dead code, naming fix, ErrorBoundary  | medium   |
| TASK-010 | Replace per-Spread setInterval with ResizeObserver          | medium   |
| TASK-011 | Regression/smoke test infrastructure                        | complete |
| TASK-012 | Subdirectory documentation                                  | low      |
| TASK-013 | TypeScript adoption                                         | low      |
| TASK-014 | Redux modernization (Redux Toolkit or Context API)          | low      |
| TASK-015 | Document local dev setup for agents                         | complete |
| TASK-016 | Expand test project URLs in dev/index.js                    | low      |
| TASK-017 | Migrate from SCSS to CSS Modules                            | low      |
| TASK-018 | Improve test coverage                                       | high     |
| TASK-021 | Fix font-face flash (FOUT) on page load                     | low      |
| TASK-022 | Fix stale full-bleed spread column position (verso/recto)   | high     |
| TASK-023 | Harden Ultimate layout-stability detection                 | high     |
| TASK-024 | Re-measure lastSpreadIndex after the layout settles        | medium   |
| TASK-025 | Consolidate page-width geometry into Viewport.getPageWidth  | medium   |
| TASK-026 | Fix infinite spinner on window resize                      | high     |
| TASK-027 | Reset view.loaded reliably; remove dead unload path        | medium   |
| TASK-028 | Replace Ultimate offsetLeft polling with event detection   | low      |
| TASK-029 | Eliminate blank spread pages (recto cols + page over-count) | high     |
| TASK-030 | Deep-linking to a spreadIndex doesn't navigate to it        | medium   |

> TASK-022 through TASK-026 are implemented and pending in-browser verification
> + commit (see `READER_BUGS.md`). TASK-027 and TASK-028 are deferred follow-ups.
> Note: TASK-022 fixes a regression introduced by TASK-010 (the per-`Spread`
> setInterval → ResizeObserver swap).

---

## Modernization Phases

### Phase 1 — Housekeeping (TASK-009)

Low-risk cleanup with no behavioural change:

- [ ] Remove commented-out dead code (navigation.js deferredCallback blocks)
- [ ] Rename `bindResizeHandlers` / `unbindResizeHandlers` to accurate names
- [ ] Add top-level `ErrorBoundary`
- [ ] Remove unused `markers` subscription from `Spread.jsx`
- [ ] Replace random ID in `Spread.jsx` with deterministic approach
- [ ] Document verso/recto multiplier rationale in `Spread.jsx`

### Phase 2 — Replace polling with observers (mostly complete)

- [x] Replace `Ultimate.jsx` RAF loop with observer-driven approach
- [x] Replace `withLastSpreadIndex` setInterval with ResizeObserver + MutationObserver
- [x] Replace per-Spread setInterval with ResizeObserver (done in TASK-007; TASK-010 is verification only)

### Phase 3 — Migrate deprecated React patterns (mostly complete)

- [x] Convert `App.jsx` from UNSAFE_componentWillMount to componentDidMount
- [x] Convert `Reader/index.jsx` from class to functional component
- [x] Replace UNSAFE_componentWillReceiveProps in Ultimate with useEffect
- [x] Replace UNSAFE_componentWillReceiveProps in Reader with useEffect (TASK-008)
- [x] Memoize ReaderContext.Provider value (H5 — done in TASK-001 migration)
- [ ] Extract navigation.js, loader.js, resize.js into custom hooks; remove selfRef shim

### Phase 4 — TypeScript adoption (TASK-013)

Not started. Migrate bottom-up: helpers → models → constants → actions/reducers →
leaf components → HOCs → layout → navigation/sidebar → Reader → App.

### Phase 5 — Redux modernization (TASK-014)

Not started. Prerequisite: TypeScript adoption (Phase 4). Options: Redux Toolkit or
Context + useReducer. Move `book.content` global into Redux state.

---

## Known Issues (not yet tasked)

- `book.content` module-level mutation bypasses React rendering pipeline (IMPROVEMENT_PLAN C4)
- `withLastSpreadIndex` L2: `setContentDimensions(0)` on slug change may trigger spurious dispatch (may be addressed — verify)
- `navigateToElementById`: hardcoded DOM selectors and unexplained `/2` division (H7)
- Layout.jsx: `debounce` called in render body creates new function on every render (H6)
- No loading state model (idle / loading-manifest / loading-chapter / ready / error)

---

## Development

```bash
npm start      # Vite dev server
npm test       # jest unit tests
npm run build  # production build
```

See `AGENTS.md` for agent working standards and task format.
See `tasks/` for all task PRDs.
