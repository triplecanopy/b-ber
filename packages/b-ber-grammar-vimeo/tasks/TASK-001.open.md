# TASK-001: Add tests for b-ber-grammar-vimeo

**Status:** not started
**Scope:** b-ber-grammar-vimeo
**Priority:** medium

## Description

`b-ber-grammar-vimeo` transforms Vimeo video embed directives into EPUB HTML
(typically a linked poster image with an iframe fallback). The test file
contains only `test.todo('Requires tests')`. Src coverage is 0%.

## Subtasks

- [ ] Audit `src/` to understand directive syntax and all output variants.
- [ ] Replace the stub with input→output tests:
  - Basic Vimeo embed: assert rendered HTML contains the expected poster
    image and/or iframe structure.
  - Missing Vimeo ID: assert logged error and graceful fallback.
  - Optional attributes (poster image override, caption).
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- Vimeo embeds in EPUB typically degrade to a static image; test the static
  fallback path thoroughly since that is what most readers will see.
- See `b-ber-grammar-attributes/__tests__/index.test.js` for the canonical
  test pattern.
- See root TASK-004 for overall coverage strategy.
