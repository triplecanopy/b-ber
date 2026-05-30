# TASK-001: Add tests for b-ber-parser-gallery

**Status:** not started
**Scope:** b-ber-parser-gallery
**Priority:** medium

## Description

`b-ber-parser-gallery` parses gallery directive content from intermediate HTML
into the structured image list consumed by `b-ber-grammar-gallery`. The test
file contains only `test.todo('Requires tests')`. Src coverage is 0%.

## Subtasks

- [ ] Audit `src/` to understand the input format and output structure
      (list of image objects with src, alt, caption fields).
- [ ] Replace the stub with input→output tests:
  - Gallery with multiple images: assert all image objects are extracted
    with correct fields.
  - Gallery with captions.
  - Single-image gallery.
  - Empty gallery: assert an empty array (not a crash).
  - Malformed image entries: assert logged error.
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- See root TASK-004 for overall coverage strategy.
