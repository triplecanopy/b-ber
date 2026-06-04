# TASK-042: E2E testing — CLI smoke tests (build artifact verification)

**Status:** not started
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #512 — https://github.com/triplecanopy/b-ber/issues/512

## Description

Implement the CLI layer of the e2e test suite (Area A from TASK-039). These
tests do not require a browser — they invoke the `bber` binary against the
kitchen-sink fixture project (TASK-041) and assert that the correct artifacts
are produced.

Tests run with Node's `child_process` or `execa`; Jest or Vitest as the test
runner (whichever the `b-ber-testing` package uses).

### Test cases

**`bber new`**

- Creates the expected directory structure in a temp directory
- `toc.yml` exists and parses as valid YAML
- `_project/_media/` exists

**`bber build epub`** (against kitchen-sink fixture)

- Exit code 0
- `_project/builds/epub/<slug>.epub` exists and is a valid zip archive
- Archive contains `META-INF/container.xml`, `OPS/content.opf`, and at
  least one XHTML file per spine entry in `toc.yml`
- OPF spine order matches `toc.yml`

**`bber build web`**

- Exit code 0
- `_project/builds/web/index.html` exists
- `_project/builds/web/*.json` (page data) exists
- HTML contains expected chapter titles from `metadata.yml`

**`bber build reader`**

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

- [ ] Confirm test runner and package location (from TASK-040)
- [ ] Set up test harness: temp-dir copy of fixture, cleanup hooks
- [ ] `bber new` smoke test
- [ ] `bber build epub` + EPUB structural assertions
- [ ] `bber build web` + HTML assertions
- [ ] `bber build reader` + manifest assertions
- [ ] `bber generate` + TOC mutation test
- [ ] External tool skip logic (pdf, mobi)
- [ ] Wire up to `npm test` in the testing package

## Notes

Branch: will use a dedicated feature branch once TASK-040 is resolved.

For EPUB validation beyond "is it a valid zip with the right files", consider
running `epubcheck` (Java) as an optional assertion — detect in PATH and skip
if absent, same as pdf/mobi.

`b-ber-validator` (the in-tree package) validates OPF/NCX but does not
perform full EPUB 3 spec validation. Both are worth running.

Parent: [[TASK-039]]
Depends on: [[TASK-040]](tooling/package), [[TASK-041]] (fixture project)
