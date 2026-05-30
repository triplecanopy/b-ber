# TASK-001: Improve test coverage for b-ber-validator

**Status:** not started
**Scope:** b-ber-validator
**Priority:** low

## Description

`b-ber-validator` has strong coverage of its core combinator and lib modules
(100%), but `src/report.ts` sits at ~7%. The report module formats validation
errors into human-readable output and is important for the developer experience.

## Subtasks

- [ ] Add tests for `src/report.ts`:
  - Given a failed validation result, assert the formatted error string
    contains the expected location, expected value, and got value.
  - Test edge cases: empty failure list, multiple failures, long input strings.
- [ ] Resolve the `test.todo('parses a gallery directive')` entry in
      `__tests__/index.js`.
- [ ] Confirm `npm test` passes with ≥ 85% statement coverage.

## Notes

- The validator is already partially written in TypeScript (`src/`). This is
  a useful reference for how other packages can adopt TypeScript incrementally
  (see root TASK-002).
- See root TASK-004 for overall coverage strategy.
