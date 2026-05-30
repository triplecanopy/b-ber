# TASK-001: Add tests for b-ber-grammar-gallery

**Status:** not started
**Scope:** b-ber-grammar-gallery
**Priority:** medium

## Description

`b-ber-grammar-gallery` transforms image gallery directives into EPUB HTML
figure groups. The test file contains only `test.todo('Requires tests')`. Src
coverage is 0%.

## Subtasks

- [ ] Audit `src/` to understand gallery directive syntax (image list, captions,
      layout attributes) and the generated HTML structure.
- [ ] Replace the stub with input→output tests:
  - Gallery with multiple images: assert the rendered `<figure>` group
    structure matches expected output.
  - Gallery with captions.
  - Single-image gallery.
  - Missing image sources: assert logged error.
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- `b-ber-parser-gallery` handles the parsing side; this package handles
  the HTML rendering side. Keep tests focused on output HTML structure.
- See `b-ber-grammar-attributes/__tests__/index.test.js` for the canonical
  test pattern.
- See root TASK-004 for overall coverage strategy.
