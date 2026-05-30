# TASK-001: Add tests for b-ber-logger

**Status:** not started
**Scope:** b-ber-logger
**Priority:** low

## Description

`b-ber-logger` is used throughout the monorepo for all console output. Its
`__tests__/index.test.js` contains only `test.todo('Requires tests')`. Adding
real tests is low-effort and ensures the logger API stays stable during the
JS→TS migration.

## Subtasks

- [ ] Replace the `test.todo` stub with real tests:
  - Each exported log level (`info`, `warn`, `error`, `debug`, etc.) is
    called with a message and the correct output method on the underlying
    transport is invoked.
  - If the logger supports log levels or silent mode, test that suppression
    works correctly.
  - Test that structured arguments (objects, arrays) are serialized as
    expected.
- [ ] Confirm `npm test` passes with ≥ 80% statement coverage.

## Notes

- Spy on the underlying transport (e.g. `console.log`) with `jest.spyOn`
  rather than importing the transport directly, so the tests aren't coupled
  to the implementation detail of which transport is used.
- See root TASK-004 for context.
