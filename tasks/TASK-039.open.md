# TASK-039: E2E Testing — umbrella

**Status:** in progress
**Scope:** monorepo
**Priority:** high
**GitHub Issue:** #505 — https://github.com/triplecanopy/b-ber/issues/505

## Description

Add end-to-end tests that verify the full b-ber pipeline — from CLI invocation
through build artifact generation to interactive reader behaviour. No such tests
exist today; the test suite covers unit and integration behaviour within
individual packages but never exercises the assembled system.

Two distinct areas require coverage:

### Area A — CLI / build pipeline

Run `bber` commands against a real fixture project, verify that the correct
artifacts are produced and are internally consistent:

- `bber new` — scaffolds a project without error
- `bber build epub` — produces a valid, navigable EPUB 3 archive
- `bber build web` — produces an HTML site with correct structure
- `bber build pdf` — produces a PDF (where external deps are present)
- `bber build reader` — produces the reader-format JSON manifest and assets
- `bber generate` — adds a chapter file to the spine and TOC

Checks: exit codes, presence and size of output files, basic structural
validity of EPUB OPF/NCX/spine, HTML output contains expected content.

### Area B — Reader app (interactive)

Launch the b-ber-reader-react app against a built reader-format project, drive
a headless browser through the full user journey:

- Page navigation (prev/next buttons, keyboard arrows)
- TOC open/close and chapter jump
- URL updates correctly reflect current location
- localStorage state persists across a simulated reload
- Custom HTML elements render: figures, footnotes, gallery, dialogue, audio,
  video, iframe, epigraph, pullquote, spread

The fixture project must include at least one instance of every custom
directive so that all output paths are exercised in a single test run.

### Package boundary

If Playwright (or any browser automation tool) pulls in >50 MB of additional
deps, isolate the e2e tests in a new `b-ber-testing` package at
`packages/b-ber-testing/`. This keeps the existing package install times
short for contributors who only work on the build pipeline.

---

## Sub-tasks

- [ ] TASK-040: Research — tooling selection, sample project design, package boundary decision
- [ ] TASK-041: Create kitchen-sink fixture project (covers all directives + all build targets)
- [ ] TASK-042: CLI smoke tests — project creation and build artifact verification
- [ ] TASK-043: Reader e2e tests — Playwright (or chosen tool) against live reader app
      _(opens after TASK-040 research is complete)_
- [ ] TASK-044: CI integration — run e2e suite on CircleCI, cache browser binaries
      _(opens after TASK-043 is stable)_

## Notes

Branch: `feat/upgrades` (research and planning); implementation tasks will
each use their own branch once the approach is decided.

Related: [[TASK-040]](research), [[TASK-041]](fixture), [[TASK-042]](CLI),
[[TASK-035]] (CircleCI — e2e will need to land there eventually).
