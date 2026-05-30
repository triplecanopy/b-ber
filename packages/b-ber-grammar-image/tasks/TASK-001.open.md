# TASK-001: Add tests for b-ber-grammar-image

**Status:** not started
**Scope:** b-ber-grammar-image
**Priority:** medium

## Description

`b-ber-grammar-image` transforms single-image directives into EPUB HTML
`<figure>` / `<img>` markup. The test file contains only
`test.todo('Requires tests')`. Src coverage is 0%.

## Subtasks

- [ ] Audit `src/` (which has both `image.js` and `index.js`) to understand
      the full directive syntax and all output variants.
- [ ] Replace the stub with input→output tests:
  - Basic image directive: assert `<figure>` + `<img src="...">` output.
  - Image with alt text and caption.
  - Image with `classes` or `epubTypes` attributes.
  - Missing src: assert logged error.
  - SVG image handling (if different from raster).
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage on both
      `image.js` and `index.js`.

## Notes

- See `b-ber-grammar-attributes/__tests__/index.test.js` for the canonical
  test pattern.
- See root TASK-004 for overall coverage strategy.
