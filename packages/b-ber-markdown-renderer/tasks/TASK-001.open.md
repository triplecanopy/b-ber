# TASK-001: Add tests for b-ber-markdown-renderer

**Status:** not started
**Scope:** b-ber-markdown-renderer
**Priority:** medium

## Description

`b-ber-markdown-renderer` converts Markdown source to intermediate HTML and
is a critical step in the build pipeline. Its `__tests__/index.test.js`
currently contains only `test.todo('Requires tests')`. Adding input→output
tests here ensures the rendering layer stays correct through the JS→TS
migration.

## Subtasks

- [ ] Audit the package's public API: what does it export, what are the
      primary entry points, and what options does it accept?
- [ ] Replace the `test.todo` stub with real input→output tests:
  - Standard Markdown elements: headings, paragraphs, lists, links, images,
    code blocks, blockquotes.
  - b-ber extended directives (if this renderer handles them directly, or
    documents the boundary where it hands off to grammar packages).
  - Edge cases: empty input, only whitespace, nested structures.
- [ ] Test that syntax highlighting is applied to fenced code blocks (or
      that the highlighter is correctly bypassed if disabled).
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- Snapshot tests are appropriate here: the renderer's job is to produce
  deterministic HTML from a given Markdown string, so `toMatchInlineSnapshot`
  or `toMatchSnapshot` is the right assertion style.
- The `src/highlightjs/` directory is excluded from coverage; leave that
  exclusion in place.
- See root TASK-004 for overall coverage strategy.
