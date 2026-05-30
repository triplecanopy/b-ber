# TASK-001: Add tests for b-ber-grammar-frontmatter

**Status:** not started
**Scope:** b-ber-grammar-frontmatter
**Priority:** medium

## Description

`b-ber-grammar-frontmatter` transforms front-matter directives (title page,
copyright, colophon, etc.) into EPUB HTML with the correct structural
semantics. The test file contains only `test.todo('Requires tests')`. Src
coverage is 0%.

## Subtasks

- [ ] Audit `src/` to understand which front-matter types are handled and
      what HTML/epub:type attributes each produces.
- [ ] Replace the stub with input→output tests:
  - Title page directive: assert `epub:type="titlepage"` and content.
  - Copyright / colophon directive.
  - Dedication directive.
  - Unknown front-matter type: assert logged warning.
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- See `b-ber-grammar-attributes/__tests__/index.test.js` for the canonical
  test pattern.
- See root TASK-004 for overall coverage strategy.
