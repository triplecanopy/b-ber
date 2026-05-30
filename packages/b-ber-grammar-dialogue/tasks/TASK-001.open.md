# TASK-001: Add tests for b-ber-grammar-dialogue

**Status:** not started
**Scope:** b-ber-grammar-dialogue
**Priority:** medium

## Description

`b-ber-grammar-dialogue` transforms dialogue block directives into structured
EPUB HTML. The test file contains only `test.todo('Requires tests')`. Src
coverage is 0%.

## Subtasks

- [ ] Audit `src/` to understand directive syntax and output structure.
- [ ] Replace the stub with input→output tests:
  - Basic dialogue block: assert rendered HTML structure matches expected
    (speaker + speech markup).
  - Multiple turns in a single block.
  - Missing speaker attribute: assert error is logged and output is graceful.
  - Nested or adjacent directives.
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- See `b-ber-grammar-attributes/__tests__/index.test.js` for the canonical
  test pattern.
- See root TASK-004 for overall coverage strategy.
