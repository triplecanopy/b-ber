# TASK-001: Add tests for b-ber-parser-section

**Status:** not started
**Scope:** b-ber-parser-section
**Priority:** medium

## Description

`b-ber-parser-section` parses section/chapter boundary markers from
intermediate HTML and produces the section hierarchy consumed by the grammar
layer. The test file contains only `test.todo('Requires tests')`. Src coverage
is 0%.

## Subtasks

- [ ] Audit `src/` to understand the input format (raw marker tokens or
      intermediate HTML) and the output structure (nested or flat section list).
- [ ] Replace the stub with input→output tests:
  - Simple section: assert open and close boundaries are detected.
  - Nested sections.
  - Section with id and type attributes.
  - Unclosed section: assert logged error and graceful handling.
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- See `b-ber-grammar-section` (TASK-001) for the complementary grammar-side
  tests.
- See root TASK-004 for overall coverage strategy.
