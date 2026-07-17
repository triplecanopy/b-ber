# TASK-042: E2E testing — CLI smoke tests (build artifact verification)

**Status:** complete
**Feature:** E2E testing
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #512 — https://github.com/triplecanopy/b-ber/issues/512

## Description

Implement the CLI layer of the e2e test suite (Area A from TASK-039). These
tests do not require a browser — they invoke the `bber` binary against the
kitchen-sink fixture project (TASK-041) and assert that the correct artifacts
are produced.

Tests run with Node's `child_process`; Playwright as the test runner (same as
the reader tests in TASK-043 — one runner for the whole `b-ber-testing` package).

### Test cases

**`bber new`**

- Creates the expected directory structure in a temp directory
- `toc.yml` exists and parses as valid YAML
- `_project/_media/` exists

**`bber build epub`** (against kitchen-sink fixture) _(priority 1)_

- Exit code 0
- `_project/builds/epub/<slug>.epub` exists and is a valid zip archive
- Archive contains `META-INF/container.xml`, `OPS/content.opf`, and at
  least one XHTML file per spine entry in `toc.yml`
- OPF spine order matches `toc.yml`

**`bber build reader`** _(priority 1)_

- Exit code 0
- `_project/builds/reader/` exists with expected manifest JSON
- Assets directory contains at least one XHTML file and one CSS file

**`bber generate`**

- Adding a chapter creates a new file in `_project/_markdown/`
- `toc.yml` is updated with the new entry

**Graceful skip for unavailable external tools**

- `bber build pdf` — detect whether `wkhtmltopdf` is in PATH; skip if not
- `bber build mobi` — detect whether `ebook-convert` (Calibre) is in PATH;
  skip if not

### Test isolation

Each test suite runs in a temporary copy of the kitchen-sink fixture (copied
into `os.tmpdir()` before each run, deleted after). Tests must not mutate
the committed fixture source.

## Subtasks

- [x] Confirm test runner (Playwright) and package location (`packages/b-ber-testing/`)
- [x] Set up test harness: temp-dir copy of fixture, cleanup hooks
- [x] `bber new` smoke test
- [x] `bber build epub` + EPUB structural assertions
- [x] `bber build reader` + manifest assertions
- [x] `bber generate` + TOC mutation test
- [x] External tool skip logic (pdf, mobi)
- [ ] `bber build web` + HTML assertions (lower priority)
- [x] Wire up to `npm test` in the testing package

## Notes

Branch: `feat/e2e`

For EPUB validation beyond "is it a valid zip with the right files", consider
running `epubcheck` (Java) as an optional assertion — detect in PATH and skip
if absent, same as pdf/mobi.

`b-ber-validator` (the in-tree package) validates OPF/NCX but does not
perform full EPUB 3 spec validation. Both are worth running.

Parent: [[TASK-039]]
Depends on: [[TASK-040]](tooling/package), [[TASK-041]] (fixture project)
