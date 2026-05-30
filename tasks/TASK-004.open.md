# TASK-004: Improve monorepo-wide test coverage

**Status:** not started
**Scope:** monorepo
**Priority:** high

## Description

Test coverage across the monorepo is uneven. Before any large-scale
refactoring — especially the JS→TS migration (TASK-002) — every package
needs enough tests that regressions surface immediately. This is a
high-level tracking task; per-package audit and implementation subtasks
will be opened as children once the coverage landscape is understood.

The goal is not 100% line coverage everywhere. The goal is behavioral
coverage: every meaningful code path that could break during a refactor
must have at least one test that would catch the breakage.

## Subtasks

- [ ] Run the current test suite across all packages and capture a baseline:
  - Which packages have tests at all?
  - Which packages have zero tests?
  - For packages that have tests, what is the current line/branch coverage?
    (Add a coverage reporter if one is not already configured.)
- [ ] Rank packages by refactoring risk × coverage gap:
  - High-churn packages with low coverage are the highest priority.
  - Packages with no tests at all are blocked from the JS→TS migration
    until baseline tests exist.
- [ ] For each package in the audit, open a package-level task
      (`packages/<name>/tasks/TASK-NNN.open.md`) with:
  - Current coverage summary.
  - List of untested public APIs or code paths.
  - Specific tests to add (happy path + known edge cases).
- [ ] Prioritize test tasks in this order:
  1. `b-ber-lib` — shared utilities; breakage here cascades everywhere.
  2. `b-ber-tasks` — build pipeline; hard to debug regressions without tests.
  3. Grammar packages — each directive type needs at least one
     input→output round-trip test.
  4. Parser packages — similar to grammar packages.
  5. `b-ber-reader-react` — UI behavior; smoke tests already started
     (see existing reader-react tasks); expand to cover nav, state, and
     rendering edge cases.
  6. CLI and templates — lower priority; integration tests may suffice.
- [ ] Once per-package tasks are open, track completion here.

## Notes

- Agents can write tests quickly. The bottleneck is knowing _what_ to test,
  not writing the code. Spend time on the audit and test specification before
  generating test code.
- For grammar and parser packages, the most valuable tests are input/output
  snapshot tests: feed a Markdown string with a directive in, assert the HTML
  out matches a fixed snapshot. These are cheap to write and catch regressions
  immediately.
- For `b-ber-reader-react`, behavioral tests (user interaction → state change →
  rendered output) are more valuable than shallow render snapshots.
- This task must be substantially complete before the JS→TS migration (TASK-002)
  begins implementation. A package without meaningful tests should not be
  converted to TypeScript — the type-checker alone is not a substitute for
  behavioral tests.
- Coverage tooling: if Jest is already in use, `--coverage` with `c8` or
  `istanbul` is the path of least resistance. Do not introduce a new test
  framework in this task.
