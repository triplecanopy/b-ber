# TASK-001: Add tests for b-ber-parser-figure

**Status:** not started
**Scope:** b-ber-parser-figure
**Priority:** medium

## Description

`b-ber-parser-figure` parses figure/caption structures from intermediate HTML.
The test file contains only `test.todo('Requires tests')`. Src coverage is 0%.

## Subtasks

- [ ] Audit `src/` to understand the input format and the parsed output
      structure (image path, alt text, caption text, figure ID).
- [ ] Replace the stub with input→output tests:
  - Figure with caption: assert all fields are extracted correctly.
  - Figure without caption.
  - Figure with missing image src: assert logged error.
  - Multiple figures in one document.
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- See root TASK-004 for overall coverage strategy.
