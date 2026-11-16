# AGENTS.md — b-ber-logger

## What This Is

`b-ber-logger` is the logging utility for the b-ber build pipeline. It exports
one `Logger` instance (`log`) that every other package imports instead of using
`console.log`. It writes levelled lines to stdout, records the warnings and
errors it reports, and times the build's tasks through its
`begin`/`end`/`done` events, printing a line per finished task and, with
`summary`, the build's stats, configuration, metadata and navigation when it
succeeds. Each error it reports is also emitted as a `failure` event.

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

`log.error(...)` reports an error and **returns** it, typed `Error`. It does
not throw and does not exit: a logger logs. Reporting means recording it in
`log.errors`, printing it if the log level shows errors, and emitting it as a
`failure` event.

**Every call site stops itself**, because nothing else will:

```ts
if (!fs.existsSync(asset)) throw log.error('Image not found [%s]', asset)

try { … } catch (err) { throw log.error('Could not load theme [%s]', name) }

promise.catch((err) => {
  throw log.error(err)
})
```

A bare `.catch(log.error)` is a bug: it resolves the chain with `undefined`,
and whatever comes next (the next task, the next format) runs. A guard throws
rather than returns by default: many run inside markdown-it render callbacks,
and a throw is the only way out of those that reaches the build.

- An `Error` argument is returned as it is. Anything else becomes a
  `ReportedError` with the formatted message. One array argument reports each
  element as its own error and returns one error with all their messages.
- An error that has been reported already is returned without being printed,
  recorded or emitted again, so an error rethrown up several chains, each
  reporting it, prints once. `log.isReported(value)` tells whether the logger
  has reported an error.
- The log level decides only whether an error is **printed**. It is recorded
  and emitted at every level, `--quiet` included (issue 744).
- The event is `failure`, with the Error, never `error`: an EventEmitter throws
  an `error` event that nothing listens for.

Who exits: `b-ber-cli`. Its `src/lib/exit.ts` wraps every command handler, and
listens for uncaught exceptions and unhandled rejections; whatever reaches it is
printed if the logger has not printed it, followed by `log.printFailure(1)`, and
the process exits 1. It also listens for `failure` and sets `process.exitCode`
to 1, as a backstop for a site that reports and fails to stop; it does not exit
there. Anything else that drives the build (a test, a script) gets an exception
or a rejection from the site that threw, and decides for itself.

Do not catch what a site throws to carry on. If a failure should not stop the
build, it is a warning: use `log.warn`.

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
- The logging methods (`error`, `warn`, `notice`, `info`, …) are
  arrow-function properties, so that callers can pass them unbound
  (`.then(log.notice)`). Everything else is an ordinary method.
- `log.error` never throws or exits. Do not add a "log and throw" variant: the
  `throw` belongs at the call site, where it is visible and TypeScript can see
  the code path end.
- `write` in `Logger.ts` is the only place the logger writes to stdout.
- No external logging library: the format and the events are the point.
