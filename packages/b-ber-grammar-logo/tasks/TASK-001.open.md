# TASK-001: Add tests for b-ber-grammar-logo

**Status:** not started
**Scope:** b-ber-grammar-logo
**Priority:** medium

## Description

`b-ber-grammar-logo` transforms logo/wordmark block directives into EPUB HTML.
The test file contains only `test.todo('Requires tests')`. Src coverage is 0%.

## Subtasks

- [ ] Audit `src/` to understand directive syntax and output structure.
- [ ] Replace the stub with input→output tests:
  - Basic logo block: assert rendered HTML contains image with correct
    structural markup.
  - Logo with alt text.
  - Missing src: assert logged error.
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- See `b-ber-grammar-attributes/__tests__/index.test.js` for the canonical
  test pattern.
- See root TASK-004 for overall coverage strategy.
