# TASK-153: Raise b-ber-tasks unit coverage

**Epic:** Unit test coverage
**GitHub Issue:** #764 — https://github.com/triplecanopy/b-ber/issues/764
**Scope:** tasks

## Description

b-ber-tasks is the largest package outside the reader (4,009 statements) and
has **13%** statement coverage (measured 2026-11-14, `main`). The epic's target
is 75%. Of its ~25 task directories, 7 have tests (`clean`, `container`,
`copy`, `inject`, `opf`, `serialize`, `helpers`).

The CLI's 100% (TASK-050) does not cover this: the CLI tests mock
b-ber-tasks. TASK-152's golden-output test protects behaviour end to end, but
runs the built CLI in a subprocess, which Jest does not instrument. This task
is the unit layer: fast, and specific about which task broke.

Order by what a refactor touches most and what has no other net:

| Task | Note |
| ---- | ---- |
| `render`, `opf`, `epub`, `reader`, `web` | core of every build |
| `sass` | TASK-051 (#518) covers it, with the theme docs |
| `loi`, `footnotes`, `cover`, `generate`, `init`, `scripts`, `xml` | |
| `serve`, `deploy`, `mobi`, `pdf`, `validate` | external processes; test the logic around them, mock the process |

## Subtasks

- [ ] Re-measure per task directory and record it here
- [ ] Core tasks first (`render`, `opf`, `epub`, `reader`, `web`)
- [ ] TASK-051 for `sass`
- [ ] The rest, to ≥ 75% for the package

## Notes

- Use real temp directories, not `mock-fs` (it does not work on Node 24).
- `b-ber-logger` calls `process.exit(1)` on `log.error`: mock it in tests that
  reach an error path, until TASK-046 removes that.
- Related: TASK-152 (golden output), TASK-051 (sass), TASK-046 (logger).
