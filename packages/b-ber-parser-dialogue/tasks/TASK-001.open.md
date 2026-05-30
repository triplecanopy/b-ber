# TASK-001: Add tests for b-ber-parser-dialogue

**Status:** not started
**Scope:** b-ber-parser-dialogue
**Priority:** medium

## Description

`b-ber-parser-dialogue` parses dialogue markup from intermediate HTML into the
structured form consumed by `b-ber-grammar-dialogue`. The test file contains
only `test.todo('Requires tests')`. Src coverage is 0%.

## Subtasks

- [ ] Audit `src/` to understand the input format (intermediate HTML or raw
      directive tokens) and output format (parsed data structure).
- [ ] Replace the stub with input→output tests:
  - Valid dialogue input: assert the parsed output has the correct structure
    (speaker, speech, turn boundaries).
  - Multi-turn dialogue.
  - Malformed input: assert an error is thrown or logged.
  - Empty input: assert an empty result rather than a crash.
- [ ] Use `jest.mock('@canopycanopycanopy/b-ber-logger')` for log spying.
- [ ] Confirm `npm test` passes with ≥ 70% statement coverage.

## Notes

- See root TASK-004 for overall coverage strategy.
