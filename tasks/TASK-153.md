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

- [ ] Re-measure per task directory and record it here (core done, below)
- [x] Core tasks first (`render`, `opf`, `epub`, `reader`, `web`)
- [ ] TASK-051 for `sass`
- [ ] The rest, to ≥ 75% for the package

## Notes

- Use real temp directories, not `mock-fs` (it does not work on Node 24).
- `b-ber-logger` calls `process.exit(1)` on `log.error`: mock it in tests that
  reach an error path, until TASK-046 removes that.
- Related: TASK-152 (golden output), TASK-051 (sass), TASK-046 (logger).

## Findings

### Core tasks (2026-11-15)

Statement coverage under `src/**/*.ts` (3,675 statements; the 4,009 above
included JS):

| Directory | Before | After |
| --------- | ------ | ----- |
| `src/render` | 0% | 100% |
| `src/opf` | 37% | 100% |
| `src/epub` | 0% | 100% |
| `src/reader` | 0% | 82% |
| `src/web` (TS only) | 0% | 100% |
| **b-ber-tasks** | **14%** | **49%** |

`src/reader` stops at 82%: lines 85–123 run only when
`require.resolve('@canopycanopycanopy/b-ber-reader')` fails, which Jest cannot
arrange per test, and lines 267–280 (`updateLinkedResourcesWithAbsolutePaths`)
are dead, their call commented out.

The tests build a real temp project (`__tests__/helpers/project.js`) and point
`State` at it. The reader tests copy `packages/b-ber-reader/dist`, so need a
build first, as other packages' tests already do. `web.test.js` maps `cheerio`
to its slim CommonJS build: under the jsdom environment cheerio resolves to its
browser ESM build, and its Node build needs web streams jsdom lacks.

Defects found, each pinned by a test asserting current behaviour:

- #768 the OPF manifest can omit `toc.ncx` / `toc.xhtml` (a race in
  `Opf.createOpf`)
- #769 the reader build fails for identifiers `createDirname` changes
- #770 writes neither returned nor awaited (render, reader manifest, web)
- #771 the search index is written in completion order (also the OPF
  manifest and `resources`: builds are not reproducible)

Also found: running Jest in the main checkout while an agent worktree exists
under `.claude/worktrees/` fails every suite (duplicate packages in Jest's
module map); `jest.config.js` now ignores `.claude/`. And `State` creating
`_project/` at import races across Jest workers (`EEXIST`), the likely cause of
TASK-128 (#646).
