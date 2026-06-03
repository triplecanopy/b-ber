# TASK-001: Improve test coverage for b-ber-tasks

**Status:** in progress
**Scope:** b-ber-tasks
**Priority:** high
**GitHub Issue:** #508 — https://github.com/triplecanopy/b-ber/issues/508

## Description

`b-ber-tasks` is the build pipeline — the ordered sequence of steps that
transforms Markdown source into EPUB, web, PDF, and other output formats.
Nearly every task module in `src/` sits at 0% statement coverage. Two test
files exist (`opf.test.js`, `serialize.test.js`) but cover only surface-level
behavior. This task adds meaningful coverage before the JS→TS migration begins.

## Current state (2026-05-30)

7 test files, 44 tests passing.

| Module                           | Stmts | Notes                                          |
| -------------------------------- | ----- | ---------------------------------------------- |
| `src/index.js`                   | 100%  | re-exports                                     |
| `src/serialize.js`               | 100%  | existing tests                                 |
| `src/opf/index.js`               | 100%  | re-exports                                     |
| `src/opf/helpers.js`             | 100%  | new tests (helpers.test.js)                    |
| `src/clean/index.js`             | 100%  | new tests (clean.test.js)                      |
| `src/container/index.js`         | 100%  | new tests (container.test.js)                  |
| `src/inject/index.js`            | 72%   | new tests (inject.test.js); writeAll untested  |
| `src/copy/index.js`              | 70%   | new tests (copy.test.js)                       |
| `src/opf/ManifestAndMetadata.js` | 8%    | minimal (existing opf.test.js)                 |
| `src/opf/Navigation.js`          | 0%    | requires full project setup — see Blockers     |
| `src/opf/Opf.js`                 | 0%    | depends on Navigation                          |
| `src/web/`, `src/reader/`        | 0%    | browser scripts + full pipeline — see Blockers |
| `src/sass/`, `src/scripts/`      | 0%    | requires real SCSS/JS compiler invocation      |
| `src/epub/`, `src/mobi/`         | 0%    | requires Calibre binary                        |
| `src/pdf/`                       | 0%    | requires wkhtmltopdf                           |
| `src/deploy/`, `src/serve/`      | 0%    | requires network/browser-sync                  |
| `src/generate/`, `src/init/`     | 0%    | requires full project directory on disk        |
| `src/loi/`, `src/footnotes/`     | 0%    | requires spine + full render pass              |
| `src/cover/`                     | 0%    | requires image manipulation tools              |
| `src/render/`                    | 0%    | requires b-ber-markdown-renderer + real files  |
| `src/validate/`                  | 0%    | requires markdown files on disk                |
| `src/xml/`                       | 0%    | requires full render pass + HtmlToXml          |

## Blockers and realistic target

**The hard limit is ~25% overall for pure unit tests.** Most `b-ber-tasks`
modules are orchestration steps that read from and write to a real EPUB project
directory. They cannot be meaningfully unit-tested without either:

1. A test fixture project with real Markdown files, toc.yml, and compiled
   XHTML output (integration test infrastructure), or
2. Deep mocking of every I/O call, which produces tests that only verify mock
   calls — not pipeline behavior.

The modules with meaningful business logic that remain untested are:

- `Navigation.js` — complex comparison logic between filesystem and YAML
- `web/Template.js` — web output template rendering
- `sass/index.js` — SCSS compilation orchestration

These are reasonable candidates for targeted unit tests if time allows, but
each requires significant state mocking to isolate.

## Subtasks

- [x] Review existing `opf.test.js` and `serialize.test.js`
- [x] Add tests for `src/opf/helpers.js` — 100% coverage
- [x] Add tests for `src/clean/` — 100% coverage
- [x] Add tests for `src/container/` — 100% coverage
- [x] Add tests for `src/inject/` — 72% coverage (getFileObjects covered)
- [x] Add tests for `src/copy/` — 70% coverage
- [ ] Add tests for `Navigation.compareXhtmlWithYaml` — needs toc.yml fixture
- [ ] Add tests for `web/Template.js` — web template logic

## Notes

- Do NOT use `mock-fs`. It does not intercept `fs` calls on Node 24. Use real
  temp dirs (`fs-extra.mkdtemp`) or mock `fs-extra` methods with `jest.fn()`.
- `@canopycanopycanopy/b-ber-logger` calls `process.exit(1)` on `log.error`.
  Use `jest.mock('@canopycanopycanopy/b-ber-logger')` in any test that hits
  an error path.
- See root TASK-004 for overall coverage strategy.
