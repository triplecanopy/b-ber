# TASK-001: Improve test coverage for b-ber-templates

**Status:** not started
**Scope:** b-ber-templates
**Priority:** low

## Description

`b-ber-templates` generates the EPUB container/manifest/NCX files from
Handlebars templates. Some areas are well-covered (Toc: 100%, Xml: 100%,
Xhtml: 90%) but two major template groups have no tests: `src/Ncx/` (0%)
and `src/Opf/` (0%). The `src/Project/` scaffolding templates sit at 42%.

## Subtasks

- [ ] Add tests for `src/Ncx/`:
  - Pass representative spine/metadata objects and assert the generated NCX
    XML string matches a snapshot.
- [ ] Add tests for `src/Opf/`:
  - `Guide.js` — guide element generation.
  - `Manifest.js` — manifest entry generation.
  - `Metadata.js` — Dublin Core metadata rendering.
  - `Spine.js` — spine element generation.
  - Pass representative data objects and assert output matches a snapshot.
- [ ] Expand `src/Project/` coverage:
  - The existing `Project.test.js` covers `metadata.yml.js` and `toc.yml.js`
    but skips the Markdown template files. Add tests for
    `project-name-chapter-01.md.js`, `project-name-colophon.md.js`, etc.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage across the
      package.

## Notes

- Snapshot tests are the right approach for template output: the templates
  produce deterministic strings from given inputs.
- The existing figure tests (`__tests__/figures/`) are a good model for
  test structure.
- See root TASK-004 for overall coverage strategy.
