# AGENTS.md — b-ber-logger

## What This Is

`b-ber-logger` is the logging utility for the b-ber build pipeline. It exports a single `Logger` class instance (`log`) that all other packages import instead of using `console.log` directly. The logger supports levelled output (`info`, `warn`, `error`, `debug`, `trace`, `notice`, `inspect`), chalk-coloured and indented formatting, indentation tracking across nested task steps, a build-run timer (via `Timer` base class), an end-of-run summary of collected warnings and errors, and quiet/verbose/debug modes driven by CLI flags parsed from `process.argv` at construction time.

## Key Files

| File                                                                                                            | Purpose                                                            |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `src/index.ts`                                                                                                  | Defines `Logger` class and exports the singleton `log` instance    |
| `src/Timer.ts`                                                                                                  | Base class; tracks elapsed time for the current build run          |
| `src/format.ts`                                                                                                 | `wrap`, `decorate`, `floatFormat` — chalk-based message formatting |
| `src/indenter.ts`                                                                                               | Indent level tracking (`incrementIndent`, `decrementIndent`, etc.) |
| `src/printer.ts`                                                                                                | `printWarnings` / `printErrors` — formatted batch output           |
| `src/summary.ts`                                                                                                | `printSummary` — end-of-run summary report                         |
| `src/configure.ts`                                                                                              | Applies runtime settings (logLevel, boringOutput)                  |
| `src/compose.ts`                                                                                                | `composeMessage` — assembles the final string before output        |
| `src/register.ts`                                                                                               | `registerSequence` — sets total task count for progress display    |
| `src/context.ts`                                                                                                | `counter`, `getContext` — task counter and context label helpers   |
| `src/events.ts`                                                                                                 | `notify` — emits internal build events                             |
| `src/listeners.ts`                                                                                              | `bind` — attaches event listeners at startup                       |
| `src/reset.ts`                                                                                                  | `reset` — resets logger state between build runs                   |
| `src/warn.ts`, `src/info.ts`, `src/error.ts`, `src/debug.ts`, `src/trace.ts`, `src/notice.ts`, `src/inspect.ts` | Individual log-level implementations                               |

## Dev Commands

```bash
npm test      # jest
npm run build # compile src/ → dist/ with tsdown (CJS)
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
