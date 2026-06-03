# TASK-001: Add tests for b-ber-logger

**Status:** in progress
**Scope:** b-ber-logger
**Priority:** low
**GitHub Issue:** #507 — https://github.com/triplecanopy/b-ber/issues/507

## Description

`b-ber-logger` is used throughout the monorepo for all console output. Its
`__tests__/index.test.js` previously contained only `test.todo('Requires tests')`.
Real tests have been added covering the core API.

## Current state (2026-05-30)

64 tests passing. Statement coverage: **73%**.

| File             | Stmts | Notes                                        |
| ---------------- | ----- | -------------------------------------------- |
| configure.js     | 100%  | all logLevel paths covered                   |
| events.js        | 100%  | notify() covered                             |
| indenter.js      | 100%  | all indent helpers covered                   |
| inspect.js       | 100%  | console.log spy                              |
| notice.js        | 100%  | always-print behavior verified               |
| reset.js         | 100%  | clears errors/warnings                       |
| error.js         | 92%   | strings, Errors, arrays; exit(1) verified    |
| Timer.js         | 85%   | start/stop/done; lines 72-79 are done() body |
| format.js        | 94%   | chalk application covered                    |
| register.js      | 84%   | logLevel >= 1 path covered                   |
| warn.js          | 81%   | logLevel > 3 timestamp branch uncovered      |
| info.js          | 77%   | logLevel > 4 stack trace branch uncovered    |
| listeners.js     | 60%   | end event high-verbosity branch uncovered    |
| summary.js       | 2%    | printSummary is complex — see Blocker        |
| debug.js         | 0%    | empty function body — Istanbul won't cover   |
| trace.js         | 0%    | empty function body — Istanbul won't cover   |
| print-version.js | 0%    | low value to test                            |
| context.js       | 18%   | getContext relies on stack trace parsing     |

## Subtasks

- [x] Replace test.todo stub with real tests
- [x] Test each log level method (warn, error, notice, info, debug, trace)
- [x] Test log level suppression (logLevel < threshold → no output)
- [x] Test configure() — quiet/verbose/debug/no-color flags
- [x] Test reset() — clears errors and warnings
- [x] Test floatFormat() — B/Kb/Mb/Gb formatting
- [x] Test indent/counter/notify helpers
- [x] Test Timer static methods (timeFormat, dateFormat)
- [x] Test Timer instance methods (start, stop)
- [x] Test event listeners (begin, end, done)
- [ ] Cover summary.js (printSummary) — needs state mock and full task sequence

## Blocker

`summary.js` is a complex rendering function that requires a full `state`
object and task timing data. Covering it requires either mocking the entire
b-ber state or running an integration test. Low priority given 73% overall.

## Notes

- Mock `process.exit` with `jest.spyOn(process, 'exit').mockImplementation(() => {})`
  — `log.error()` calls `process.exit(1)`. Without this mock, tests crash.
- Mock `process.stdout.write` to suppress output during tests.
- Mock `process.stdout.clearLine` and `process.stdout.cursorTo` — these TTY
  methods don't exist in Jest's test environment.
- Set `log.boringOutput = true` in beforeEach to suppress chalk escape codes
  from assertion strings.
- See root TASK-004 for context.
