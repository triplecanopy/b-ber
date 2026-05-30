# AGENTS.md — b-ber-logger

## What This Is

`b-ber-logger` is the logging utility for the b-ber build pipeline. It exports a single `Logger` class instance (`log`) that all other packages import instead of using `console.log` directly. The logger supports levelled output (`info`, `warn`, `error`, `debug`, `trace`, `notice`, `inspect`), chalk-coloured and indented formatting, indentation tracking across nested task steps, a build-run timer (via `Timer` base class), an end-of-run summary of collected warnings and errors, and quiet/verbose/debug modes driven by CLI flags parsed from `process.argv` at construction time.

## Key Files

| File                                                                                                            | Purpose                                                            |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/index.js`                                                                                                  | Defines `Logger` class and exports the singleton `log` instance    |
| `src/Timer.js`                                                                                                  | Base class; tracks elapsed time for the current build run          |
| `src/format.js`                                                                                                 | `wrap`, `decorate`, `floatFormat` — chalk-based message formatting |
| `src/indenter.js`                                                                                               | Indent level tracking (`incrementIndent`, `decrementIndent`, etc.) |
| `src/printer.js`                                                                                                | `printWarnings` / `printErrors` — formatted batch output           |
| `src/summary.js`                                                                                                | `printSummary` — end-of-run summary report                         |
| `src/configure.js`                                                                                              | Applies runtime settings (logLevel, boringOutput)                  |
| `src/compose.js`                                                                                                | `composeMessage` — assembles the final string before output        |
| `src/register.js`                                                                                               | `registerSequence` — sets total task count for progress display    |
| `src/context.js`                                                                                                | `counter`, `getContext` — task counter and context label helpers   |
| `src/events.js`                                                                                                 | `notify` — emits internal build events                             |
| `src/listeners.js`                                                                                              | `bind` — attaches event listeners at startup                       |
| `src/reset.js`                                                                                                  | `reset` — resets logger state between build runs                   |
| `src/warn.js`, `src/info.js`, `src/error.js`, `src/debug.js`, `src/trace.js`, `src/notice.js`, `src/inspect.js` | Individual log-level implementations                               |

## Dev Commands

```bash
npm test      # jest
npm run build # babel transpile src/ → dist/
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- The singleton pattern is intentional: `log` is a single shared instance across the entire build process. Do not instantiate `Logger` manually.
- All log-level functions are bound to the `Logger` instance in the constructor. They are not standalone exports.
- `chalk` is used for colour output. The `--no-color` / `boringOutput` flag disables chalk globally for CI environments.
- CLI flags (`--quiet`, `--verbose`, `--debug`, `--log-level=N`) are read from `process.argv` in the constructor; no separate config step is needed.

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the
root AGENTS.md. No tasks are currently open. To add a task, create
tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
