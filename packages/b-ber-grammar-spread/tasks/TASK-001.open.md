# TASK-001: Add tests for b-ber-grammar-spread

**Status:** not started
**Scope:** b-ber-grammar-spread
**Priority:** medium

## Description

`b-ber-grammar-spread` transforms full-bleed spread image directives into EPUB
HTML. The test file contains only `test.todo('Requires tests')`. Src coverage
is 0%.

## Subtasks

- [ ] Audit `src/` to understand spread directive syntax (verso/recto
      classification, image sources, alt text).
- [ ] Replace the stub with input→output tests:
  - Basic spread: assert rendered HTML contains both verso and recto images
    (or single spread image) with correct markup.
  - Verso-only and recto-only variants (if supported).
  - Missing image source: assert logged error.
  - `classes` / `epubTypes` attribute passthrough.
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- See `b-ber-grammar-attributes/__tests__/index.test.js` for the canonical
  test pattern.
- See root TASK-004 for overall coverage strategy.
