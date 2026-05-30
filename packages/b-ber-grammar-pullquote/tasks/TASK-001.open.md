# TASK-001: Add tests for b-ber-grammar-pullquote

**Status:** not started
**Scope:** b-ber-grammar-pullquote
**Priority:** medium

## Description

`b-ber-grammar-pullquote` transforms pull-quote block directives into EPUB
HTML `<blockquote>` / `<aside>` structures. The test file contains only
`test.todo('Requires tests')`. Src coverage is 0%.

## Subtasks

- [ ] Audit `src/` to understand directive syntax and output structure.
- [ ] Replace the stub with input→output tests:
  - Basic pull-quote: assert the rendered HTML `<blockquote>` or `<aside>`
    contains the expected content.
  - Pull-quote with attribution.
  - Pull-quote with custom `classes` or `epubTypes`.
  - Missing content: assert logged warning.
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- See `b-ber-grammar-attributes/__tests__/index.test.js` for the canonical
  test pattern.
- See root TASK-004 for overall coverage strategy.
