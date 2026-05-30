# TASK-001: Add tests for b-ber-grammar-footnotes

**Status:** not started
**Scope:** b-ber-grammar-footnotes
**Priority:** medium

## Description

`b-ber-grammar-footnotes` transforms footnote directives into EPUB-compliant
HTML including reference links and definition markup. The test file contains
only `test.todo('Requires tests')`. Src coverage is 0%.

## Subtasks

- [ ] Audit `src/` to understand the reference and definition directive
      syntax and the generated link/anchor structure.
- [ ] Replace the stub with input→output tests:
  - Footnote reference inline marker.
  - Footnote definition block.
  - Multiple footnotes in a document.
  - Reference with no matching definition: assert logged warning.
  - Definition with no matching reference.
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- Footnote handling also involves `b-ber-parser-footnotes`; coordinate if
  the grammar and parser packages share logic.
- See `b-ber-grammar-attributes/__tests__/index.test.js` for the canonical
  test pattern.
- See root TASK-004 for overall coverage strategy.
