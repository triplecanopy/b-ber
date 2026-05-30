# TASK-001: Add tests for b-ber-grammar-section

**Status:** not started
**Scope:** b-ber-grammar-section
**Priority:** medium

## Description

`b-ber-grammar-section` transforms section/chapter boundary directives into
EPUB HTML `<section>` elements with correct `epub:type` semantics. The test
file contains only `test.todo('Requires tests')`. Src coverage is 0%.

## Subtasks

- [ ] Audit `src/` to understand the open/close directive pair syntax and
      all supported section types.
- [ ] Replace the stub with input→output tests:
  - Opening section directive: assert `<section epub:type="...">` output.
  - Closing section directive: assert `</section>` output.
  - Section with custom `classes` or `id` attributes.
  - Mismatched open/close ids: assert logged error.
  - All supported `epub:type` values produce the correct attribute.
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- See `b-ber-grammar-attributes/__tests__/index.test.js` for the canonical
  test pattern.
- See root TASK-004 for overall coverage strategy.
