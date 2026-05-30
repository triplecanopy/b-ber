# TASK-001: Add tests for b-ber-grammar-audio-video

**Status:** not started
**Scope:** b-ber-grammar-audio-video
**Priority:** medium

## Description

`b-ber-grammar-audio-video` transforms audio and video embed directives in
Markdown source into EPUB-compliant HTML. The test file contains only
`test.todo('Requires tests')`. Src coverage is 0%.

## Subtasks

- [ ] Audit `src/` to understand the directive syntax and all output variants.
- [ ] Replace the stub with input→output tests:
  - Audio directive: assert the rendered HTML contains a `<audio>` element
    with the correct `src`, MIME type, and fallback content.
  - Video directive: assert `<video>` output with correct attributes.
  - Missing or malformed source attribute: assert a logged error and graceful
    fallback (no crash).
  - Optional attributes (`autoplay`, `controls`, `loop`, etc.).
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` to suppress and
      spy on log output (follow the pattern in `b-ber-grammar-attributes`).
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- See `b-ber-grammar-attributes/__tests__/index.test.js` for the canonical
  test pattern used in this package family.
- See root TASK-004 for overall coverage strategy.
