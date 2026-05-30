# TASK-001: Improve test coverage for b-ber-cli

**Status:** not started
**Scope:** b-ber-cli
**Priority:** low

## Description

`b-ber-cli` is the entry point for all `b-ber` commands. The existing tests
in `__tests__/commands/` only assert that each command file exports a valid
yargs object shape — they do not test that the command handler actually
invokes the correct tasks or handles errors. Statement coverage sits at ~24%
for `src/commands/` and ~15% for `src/lib/`.

## Subtasks

- [ ] Audit `src/commands/` to list all command handlers and the tasks they
      delegate to.
- [ ] For each command handler, add a test that:
  - Calls the `handler` function with mock argv.
  - Asserts the correct `b-ber-tasks` function was invoked (mock the tasks
    module).
  - Asserts error handling: if the task rejects, `fail` from `b-ber-lib`
    is called with the error.
- [ ] Add tests for `src/lib/`:
  - Any shared CLI utilities (argument parsing helpers, path resolution, etc.)
- [ ] Confirm `npm test` passes with ≥ 60% statement coverage on
      `src/commands/` and `src/lib/`.

## Notes

- Keep all task modules mocked — CLI tests should verify the command
  wiring, not the task implementations.
- The existing test helper pattern (mock `b-ber-tasks`, mock `b-ber-lib/State`,
  mock `b-ber-lib/utils`) is correct; extend it rather than replacing it.
- See root TASK-004 for overall coverage strategy.
