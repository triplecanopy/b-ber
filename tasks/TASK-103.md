# TASK-103: Convert static-only helper classes to modules

**Status:** complete
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

- [x] Confirmed all 8 targets are pure statics (no constructor / instance
      state / `new X()`); `get`/`set`/`clear` collide across Storage & Cache.
- [x] Converted to named-export module functions. **Consumed via `import * as X`
      (namespace), not bare-name imports** — chosen over the literal
      `Viewport.getPageWidth → getPageWidth` rewrite because (a) the generic
      `get`/`set`/`clear` names collide when a file uses two helpers, and (b)
      namespace imports leave `X.method()` call sites untouched (one import line
      per file), which is far lower-risk across ~50 importers. Still
      tree-shakeable (Rollup/Vite track namespace member usage).
- [x] Updated test imports/mocks. `jest.mock('../helpers/X')` auto-mock works
      unchanged with named exports. **`jest.spyOn(X, 'method')` does NOT** — ES
      namespace bindings are non-configurable — so spy-based tests were switched
      to `jest.mock` (Footnote→Request auto-mock; Reader/index→Asset partial mock
      with `requireActual`).
- [x] **Viewport kept as a default-exported object** (declassed) rather than
      named exports — it is `jest.spyOn`'d across ~10 test files, and converting
      those to partial auto-mocks was high-churn/high-risk for negligible
      tree-shaking gain (the Reader uses nearly all of Viewport). Zero call-site
      / test churn. Recorded as a deliberate deviation.
- [x] Ran the full reader-react suite after each helper (test-propagation).
- [x] 9 snapshots unchanged; tests pass (62 suites / 407); `tsc --noEmit` clean.
- [x] One commit per helper (DOM, Cache, Storage, Request, Asset, Url,
      XMLAdaptor, Viewport); PLAN.md updated; `.open` removed.

## Notes (implementation)

- Conversion order followed the dependency graph loosely; each commit flipped
  **all** importers of the converted helper (src + helper-to-helper + tests) to
  `import * as X` in the same commit, so every commit stayed green.
- `detect-browser` / `lib/browser` was left alone (not a static-class helper;
  still used for Safari checks).

## Notes

- Wide-but-shallow: `Viewport`/`Url` alone have many call sites. One-commit-per-
  helper keeps each diff revertible and reviewable.
- Coordinate with [[TASK-073]]/Step 4 and [[TASK-105]] (colocation) timing —
  this touches imports broadly, so land it during a quiet window to avoid
  conflicts with the larger refactors.
- Some helpers also use `console.*` directly; leave logging behavior as-is here
  (separate concern).
- Related: [[TASK-068]] (housekeeping).
