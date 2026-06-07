# TASK-041: E2E testing — create kitchen-sink fixture project

**Status:** complete
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #511 — https://github.com/triplecanopy/b-ber/issues/511

## Description

Create the fixture project that all e2e tests run against. This is a
self-contained b-ber project (the same structure a user would create with
`bber new`) that exercises every custom directive and every build target.

The fixture project lives at the path decided in TASK-040 (likely
`packages/b-ber-testing/fixtures/kitchen-sink/` or `fixtures/kitchen-sink/`).
It is committed to the repo — it is source content, not a build artifact.

### Required directive coverage

Every b-ber-grammar-\* package must be represented by at least one directive
instance. From the package inventory:

| Directive      | Example in fixture                           |
| -------------- | -------------------------------------------- |
| section        | chapter boundary markers                     |
| frontmatter    | title page, copyright page                   |
| footnotes      | footnote definition + reference in body text |
| figure / image | figure with caption and alt text             |
| gallery        | 2–3 image gallery layout                     |
| audio-video    | audio embed + video embed                    |
| iframe         | embedded iframe                              |
| dialogue       | speaker/speech block                         |
| epigraph       | epigraph at chapter start                    |
| pullquote      | pull-quote block mid-chapter                 |
| spread         | full-bleed spread image                      |
| logo           | logo/wordmark block                          |
| attributes     | inline attribute block (class/id injection)  |

### Required structure

- `_project/` — standard b-ber source layout
  - `toc.yml` — at least 5 spine entries (cover + 3 chapters + backmatter)
  - `metadata.yml` — valid Dublin Core metadata
  - `_markdown/` — one `.md` file per chapter, all directives covered
  - `_images/` — sample images for figure/gallery/spread
  - `_fonts/` — not required (use theme default)

### Build targets to verify in CLI tests

- epub (always)
- reader (always; required for Area B tests)
- web (lower priority; add once epub + reader are stable)
- pdf (skip in CI unless wkhtmltopdf is installed; detect and skip gracefully)
- mobi (skip in CI unless Calibre is installed; detect and skip gracefully)

## Subtasks

- [x] Confirm fixture location: `packages/b-ber-testing/fixtures/kitchen-sink/`
- [x] Scaffold `packages/b-ber-testing/` as a private workspace package
- [x] Write `toc.yml` and `metadata.yml`
- [x] Write chapter Markdown files covering all directives
- [x] Add sample image assets (small PNGs — <20 KB each, committed to repo)
- [x] Verify `bber build epub` completes without errors against the fixture
- [x] Verify `bber build reader` completes without errors

## Notes

Branch: `feat/e2e`

The fixture should use a theme that is always available (b-ber-theme-serif).
Images should be minimal (solid-colour PNGs generated programmatically if
needed) to keep the repo size small.

Parent: [[TASK-039]]
Depends on: [[TASK-040]] (for package boundary / location decision)
