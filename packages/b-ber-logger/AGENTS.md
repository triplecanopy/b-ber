# AGENTS.md — b-ber-logger

## What This Is

`b-ber-logger` is the logging utility for the b-ber build pipeline. It exports
one `Logger` instance (`log`) that every other package imports instead of using
`console.log`. It writes levelled lines to stdout, records the warnings and
errors it reports, and times the build's tasks through its
`begin`/`end`/`done` events, printing a line per finished task and, with
`summary`, the build's stats, configuration, metadata and navigation when it
succeeds.

It does not exit the process and does not read the command line. Both belong to
`b-ber-cli` (see "Errors and exiting" and "Configuration" below).

## Key Files

| File            | Purpose                                                                    |
| --------------- | -------------------------------------------------------------------------- |
| `src/index.ts`  | Creates and default-exports the shared instance; its only export            |
| `src/Logger.ts` | The `Logger` class: levels, output format, error reporting, events, summary |
| `src/Timer.ts`  | Measures task and run times. Emits nothing; `Logger` owns the events        |

`index.ts` must keep a single default export: that is what makes the CommonJS
build `module.exports = log`, which every package's `import log from` relies
on. Types and helpers stay in `Logger.ts`.

## Errors and exiting

`log.error(...)` reports an error and then **throws** it. The code after the
call does not run, and in a promise chain `.catch(log.error)` passes the
rejection on, so the chain stays rejected. It is typed `never`.

- An `Error` argument is thrown as it is. Anything else becomes a
  `ReportedError` with the formatted message. One array argument reports each
  element as its own error.
- An error that has been reported already is rethrown without printing it again,
  so `.catch(log.error)` at every level of a chain prints the error once.
- `log.report(...)` does the reporting without the throw and returns the error;
  `log.isReported(value)` tells whether the logger has printed an error.
- The log level decides only whether an error is **printed**. It is recorded
  and thrown at every level, `--quiet` included (issue 744).

Who exits: `b-ber-cli`. Its `src/lib/exit.ts` wraps every command handler, and
listens for uncaught exceptions and unhandled rejections; whatever reaches it is
printed if the logger has not printed it, followed by `log.printFailure(1)`, and
the process exits 1. Anything else that drives the build (a test, a script) gets
an exception or a rejection, and decides for itself.

Do not catch what `log.error` throws to carry on. If a failure should not stop
the build, it is a warning: use `log.warn`.

## Configuration

`new Logger(options)` and `log.configure(options)` take
`{ logLevel, boringOutput, summary }`; `configure` changes only the options it
is given. The shared instance starts at the defaults (level 2, colour, no
summary). `b-ber-cli` reads `--quiet`, `--verbose`, `--debug`,
`--log-level=N`, `--no-color` and `--summary` (`src/lib/logger-options.ts`) and
calls `log.configure` before it loads anything else, because b-ber-lib's
`State` logs while it loads.

## Levels and output

| Level | Name    | Shows                                                       |
| ----- | ------- | ----------------------------------------------------------- |
| 0     | quiet   | nothing                                                     |
| 1     | error   | errors, and notices (`log.notice`, "Build succeeded")       |
| 2     | warn    | warnings (the default)                                      |
| 3     | info    | a line per finished task, and a timestamp on every line     |
| 4     | verbose | `log.info`, and the stack trace of each warning and error   |
| 5     | debug   | the stack trace of each `log.info` line                     |

Every line is `[timestamp] b-ber LABEL message`, the timestamp from level 3.
The labels are `ERR!`, `WARN` and `info` (notices and info share `info`: they
differ in when they are shown, not in what they mean). They are all four
characters wide and differ in the word itself, so the output reads without
colour. In a message, `{N}` is formatted as a byte count and `[text]` is
highlighted; without colour the brackets stay. Colour is off with
`boringOutput`, and whenever chalk finds that stdout cannot show it.

`log.debug` and `log.trace` are no-ops. `log.inspect` prints any value in full.

## Dev Commands

```bash
npm test      # jest
npm run build # compile src/ → dist/ with tsdown (CJS)
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- The singleton is intentional: `log` is one shared instance across the whole
  build. Packages import it; only tests construct a `Logger`.
- The logging methods (`error`, `report`, `warn`, `notice`, `info`, …) are
  arrow-function properties, because callers pass them unbound
  (`.catch(log.error)`). Everything else is an ordinary method.
- `write` in `Logger.ts` is the only place the logger writes to stdout.
- No external logging library: the format and the events are the point.
