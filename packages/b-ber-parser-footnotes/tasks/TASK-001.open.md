# TASK-001: Add tests for b-ber-parser-footnotes

**Status:** not started
**Scope:** b-ber-parser-footnotes
**Priority:** medium

## Description

`b-ber-parser-footnotes` parses footnote markers and definitions from
intermediate HTML and produces the reference/definition pairs consumed by the
grammar layer. The test file contains only `test.todo('Requires tests')`. Src
coverage is 0%.

## Subtasks

- [ ] Audit `src/` to understand the marker/definition syntax and the parsed
      output structure (reference id → definition content map).
- [ ] Replace the stub with input→output tests:
  - Single footnote: assert reference and definition are correctly paired.
  - Multiple footnotes in a document.
  - Footnote with HTML content in the definition.
  - Orphaned reference (no matching definition): assert logged warning.
  - Orphaned definition (no matching reference): assert logged warning.
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- See `b-ber-grammar-footnotes` (TASK-001) for the complementary grammar-side
  tests.
- See root TASK-004 for overall coverage strategy.
