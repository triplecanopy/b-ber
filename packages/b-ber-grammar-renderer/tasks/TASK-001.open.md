# TASK-001: Add tests for b-ber-grammar-renderer

**Status:** not started
**Scope:** b-ber-grammar-renderer
**Priority:** medium

## Description

`b-ber-grammar-renderer` is the core grammar rendering engine — it orchestrates
how individual directive grammars are applied to Markdown source. The test file
contains only `test.todo('Requires tests')`. Src coverage is 0%.

## Subtasks

- [ ] Audit `src/` to understand what the renderer orchestrates: how it
      discovers and applies directive grammars, how it handles errors, and
      what it returns.
- [ ] Replace the stub with tests:
  - Given a Markdown string with a known directive, assert the renderer
    returns processed HTML with the directive correctly expanded.
  - Unknown directive: assert a logged warning and passthrough of the raw
    text (or whatever the specified fallback behavior is).
  - Multiple directives in one document.
  - Nested directives (if supported).
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- As the central orchestrator, this package's tests have the highest value
  for catching regressions during the JS→TS migration.
- See `b-ber-grammar-attributes/__tests__/index.test.js` for the canonical
  test pattern.
- See root TASK-004 for overall coverage strategy.
