# TASK-001: Improve test coverage for b-ber-tasks

**Status:** not started
**Scope:** b-ber-tasks
**Priority:** high

## Description

`b-ber-tasks` is the build pipeline — the ordered sequence of steps that
transforms Markdown source into EPUB, web, PDF, and other output formats.
Nearly every task module in `src/` sits at 0% statement coverage. Two test
files exist (`opf.test.js`, `serialize.test.js`) but cover only surface-level
behavior. This task adds meaningful coverage before the JS→TS migration begins.

## Current state (by module)

| Module                           | Stmts   | Notes                          |
| -------------------------------- | ------- | ------------------------------ |
| `src/index.js`                   | 100%    | just re-exports                |
| `src/serialize.js`               | unknown | has tests in serialize.test.js |
| `src/opf/index.js`               | 100%    | just re-exports                |
| `src/opf/ManifestAndMetadata.js` | 8%      | minimal                        |
| `src/opf/Navigation.js`          | 0%      | untested                       |
| `src/opf/Opf.js`                 | 0%      | untested                       |
| `src/opf/helpers.js`             | 18%     | minimal                        |
| `src/inject/index.js`            | 20%     | minimal                        |
| `src/clean`, `copy`, `container` | 0%      | untested                       |
| `src/generate`, `init`, `render` | 0%      | untested                       |
| `src/sass`, `scripts`, `web`     | 0%      | untested                       |
| `src/epub`, `mobi`, `pdf`        | 0%      | untested                       |

## Subtasks

- [ ] Review existing `opf.test.js` and `serialize.test.js` to understand
      what is already covered; expand both rather than replacing them.
- [ ] Add unit tests for `src/opf/`:
  - `ManifestAndMetadata.js` — manifest item construction, metadata merging
  - `Navigation.js` — navigation document generation
  - `helpers.js` — OPF helper functions (path resolution, ID generation)
- [ ] Add unit tests for `src/inject/` — HTML injection logic.
- [ ] Add unit tests for `src/clean/` — file system cleanup (use `mock-fs`).
- [ ] Add unit tests for `src/container/` — EPUB container.xml generation.
- [ ] Add unit tests for `src/sass/` — SCSS compilation orchestration
      (mock the actual SCSS compiler; test the orchestration logic).
- [ ] For modules that are deeply side-effectful (deploy, serve, mobi/pdf
      conversion), write smoke tests that mock external tools and assert the
      correct commands or file writes are triggered.
- [ ] For `src/web/`, add tests for:
  - `Template.js` — web template rendering
  - `navigation.js` — navigation structure generation
  - `search.js` — search index building
- [ ] Confirm `npm test` passes with coverage ≥ 50% statements on the
      most-exercised modules (`opf`, `inject`, `container`, `sass`).

## Notes

- Most task modules do file I/O and spawn external processes. Use `mock-fs`
  for file system operations and `jest.mock` for child_process/external tools.
- Do not attempt to integration-test a full build pass in this task — that
  is an end-to-end concern. Unit-test the transformation logic in isolation.
- `src/web/` is the largest and most complex module. Tackle it last.
- See root TASK-004 for overall coverage strategy.
