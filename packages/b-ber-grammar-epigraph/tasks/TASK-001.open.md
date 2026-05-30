# TASK-001: Add tests for b-ber-grammar-epigraph

**Status:** not started
**Scope:** b-ber-grammar-epigraph
**Priority:** medium

## Description

`b-ber-grammar-epigraph` transforms epigraph block directives into EPUB HTML
with correct semantic markup. The test file contains only
`test.todo('Requires tests')`. Src coverage is 0%.

## Subtasks

- [ ] Audit `src/` to understand directive syntax and output structure.
- [ ] Replace the stub with input→output tests:
  - Basic epigraph with text and attribution.
  - Epigraph without attribution.
  - Multiple epigraphs in sequence.
  - Missing required attributes: assert logged error and graceful fallback.
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- See `b-ber-grammar-attributes/__tests__/index.test.js` for the canonical
  test pattern.
- See root TASK-004 for overall coverage strategy.
