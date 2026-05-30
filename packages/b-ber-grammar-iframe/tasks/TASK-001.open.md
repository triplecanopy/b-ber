# TASK-001: Add tests for b-ber-grammar-iframe

**Status:** not started
**Scope:** b-ber-grammar-iframe
**Priority:** medium

## Description

`b-ber-grammar-iframe` transforms inline frame embed directives into EPUB
HTML `<iframe>` elements. The test file contains only
`test.todo('Requires tests')`. Src coverage is 0%.

## Subtasks

- [ ] Audit `src/` to understand directive syntax (src, dimensions, fallback).
- [ ] Replace the stub with input→output tests:
  - Basic iframe: assert `<iframe src="...">` output with correct attributes.
  - Iframe with explicit width/height.
  - Missing src: assert logged error and graceful fallback.
  - Fallback content inside the iframe element.
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- See `b-ber-grammar-attributes/__tests__/index.test.js` for the canonical
  test pattern.
- See root TASK-004 for overall coverage strategy.
