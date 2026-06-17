# TASK-105: Component colocation + structure pass (HOLD)

**Status:** blocked — do not start until the codebase stabilizes (see Notes)
**Feature:** React 19 (reader-react)
**Phase:** Modernization — structure
**Priority:** low
**Model:** Sonnet 4.6 — mechanical file moves + import rewrites, guarded by the
test suite. High churn, low logic risk.

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> §5 (no reorganization beyond what a conversion requires — this *is* the
> dedicated reorganization task).

## Description

Reorganize reader-react into a colocated per-component directory structure for
maintainability — each component owns its view, styles, types, and (eventually)
tests in one folder:

```
Marker/
  Marker.tsx
  Marker.module.css      // paired with TASK-076 (SCSS → CSS Modules)
  types.ts               // only when shared/large; otherwise keep inline
  index.ts               // re-export so import paths stay '.../Marker'
```

Also pull large/shared inline type blocks into `types.ts` files and replace
inline/conditional `style={...}` with CSS-module classes + `data-*` state
variants where it improves clarity. Shared store types stay central in
`src/store/types.ts`.

## Subtasks

- [ ] Agree the canonical structure (folder per component; `index.ts`
      re-export; when to split `types.ts`) and document it (pairs with
      [[TASK-071]] subdir docs).
- [ ] **Verify tooling first** (see Notes): coverage globs, build/`tsdown`
      include/exclude, Biome globs, and jest `testMatch` all handle the new
      layout — especially if tests are colocated.
- [ ] Move components into folders + add `index.ts` re-exports; rewrite imports.
- [ ] Replace inline/conditional styles with CSS-module classes (coordinate with
      [[TASK-076]]).
- [ ] Extract shared/large component types into `types.ts`.
- [ ] Modernize the remaining render-prop context consumer to a hook:
      `SpreadFigure` reads `SpreadContext` via `<SpreadContext.Consumer>`
      (pre-hooks API) while already using `useContext` for the reader contexts —
      switch it to `const { left } = useContext(SpreadContext)`. Behavior-
      identical, purely idiomatic. (`SpreadContext.Provider` in `Spread` stays —
      it passes per-spread positional data down a subtree, correctly a context,
      not store state. Left from the TASK-106 ReaderApiContext split.)
- [ ] 9 snapshots unchanged; tests pass; `tsc --noEmit` clean; build output
      unchanged (compare `dist`); circular-import check clean.
- [ ] Commit (per-area, reviewable); update `PLAN.md`; remove `.open`

## Notes

- **HOLD until the codebase stabilizes.** This is the most disruptive change
  (relocates files, rewrites imports) and will collide with the in-flight state
  migration ([[TASK-073]]/Step 4) and helper→module work ([[TASK-103]]) if done
  first. Sequence it **after** those land. CSS Modules ([[TASK-076]]) is
  comparatively orthogonal and can precede or pair with this.
- **Colocated tests — explicitly deferred within this task / not yet decided.**
  The user wants tests colocated eventually, but only once it's verified the new
  location is picked up by coverage, the production build excludes them
  (`*.test.tsx` must not ship in `dist`), Biome/jest globs match, and the
  coverage thresholds (75% monorepo-wide) still compute correctly. Until that
  tooling audit is done and the codebase has settled, **keep tests in the
  existing `__tests__/` mirror.** Treat colocating tests as a follow-up sub-pass
  guarded by that audit.
- Related: [[TASK-076]] (CSS Modules), [[TASK-071]] (subdir docs),
  [[TASK-073]] (state migration — sequence before this), [[TASK-103]]
  (helper→module — sequence before this).
