# TASK-103: Convert static-only helper classes to modules

**Status:** not started
**Feature:** React 19 (reader-react)
**Phase:** Modernization — housekeeping
**Priority:** low
**Model:** Sonnet 4.6 — mechanical, wide-but-shallow; the test suite is the
guardrail. Best done when the full reader-react suite can run as a gate.

> Read [`MIGRATION-CONVENTIONS.md`](../packages/b-ber-reader-react/MIGRATION-CONVENTIONS.md)
> §1 (verification gate). Behavior-preserving; no logic changes.

## Description

Several `src/helpers/` modules are classes whose members are **all `static`** —
i.e. namespaces, not objects with instance state. Prefer plain module functions
(better tree-shaking, less `static` noise, simpler mocking). The monorepo
standard already favors utility modules over classes unless there's a strong
reason; none of these have one.

### Static-only classes to convert

`Asset`, `Cache`, `DOM`, `Request`, `Storage`, `Url`, `Viewport`, `XMLAdaptor`
(all in `src/helpers/`). Leave genuine stateful classes alone (e.g. the
`models/` `SpineItem`/`ViewerSettings`/etc. carry instance state — out of scope).

## Subtasks

- [ ] Confirm each target has no instance state / `constructor` logic (pure
      statics) before converting; defer any that don't qualify.
- [ ] Convert to named-export module functions (e.g. `Viewport.getPageWidth(...)`
      → `getPageWidth(...)`); update all call sites and imports.
- [ ] Update the corresponding `__tests__/helpers/*.test.js` to import the
      functions; jest module mocks (`jest.mock('../helpers/X')`) may need the
      shape updated from default-class to named exports.
- [ ] Run the **test-propagation rule**: these helpers are imported widely
      (grammar/parsers don't use reader-react helpers, but reader-react does
      heavily) — run the full reader-react suite.
- [ ] 9 snapshots unchanged; tests pass; `tsc --noEmit` clean
- [ ] Commit (consider one commit per helper to keep diffs reviewable); update
      `PLAN.md`; remove `.open`

## Notes

- Wide-but-shallow: `Viewport`/`Url` alone have many call sites. One-commit-per-
  helper keeps each diff revertible and reviewable.
- Coordinate with [[TASK-073]]/Step 4 and [[TASK-105]] (colocation) timing —
  this touches imports broadly, so land it during a quiet window to avoid
  conflicts with the larger refactors.
- Some helpers also use `console.*` directly; leave logging behavior as-is here
  (separate concern).
- Related: [[TASK-068]] (housekeeping).
