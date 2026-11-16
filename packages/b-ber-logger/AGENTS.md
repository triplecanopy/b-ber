# AGENTS.md — b-ber-logger

## What This Is

`b-ber-logger` is the logging utility for the b-ber build pipeline. It exports
one `Logger` instance (`log`) that every other package imports instead of using
`console.log`. It records the warnings and errors it reports, emits every
message and the build's progress as events, and times the build's tasks. It
does not write: a **reporter** listens to the events and draws them (see
"Reporters" below). Each error it reports is also emitted as a `failure` event.

It does not exit the process and does not read the command line. Both belong to
`b-ber-cli` (see "Errors and exiting" and "Configuration" below).

## Key Files

| File            | Purpose                                                                    |
| --------------- | -------------------------------------------------------------------------- |
| `src/index.ts`  | Creates and default-exports the shared instance; its only export            |
| `src/Logger.ts` | The `Logger` class: recording, error reporting, events, the active reporter |
| `src/types.ts`  | `LEVEL`, the events (`LoggerEvents`), options and the reporter interface    |
| `src/format.ts` | The line format and colour every reporter shares, and the `--summary` lines |
| `src/reporters/LinesReporter.ts`   | A line per message: `--verbose`, `--log-level` ≥ 3, `--quiet`, and the default |
| `src/reporters/CompactReporter.ts` | `progress` (a redrawing line) and `plain` (the same, for pipes and CI)          |
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
`{ logLevel, boringOutput, summary, reporter }`; `configure` changes only the
options it is given. The shared instance starts at the defaults (level 2,
colour, no summary, the `lines` reporter). `b-ber-cli` reads `--quiet`,
`--verbose`, `--debug`, `--log-level=N`, `--no-color` and `--summary`
(`src/lib/logger-options.ts`), chooses the reporter, and calls `log.configure`
before it loads anything else, because b-ber-lib's `State` logs while it loads.

## Reporters

The logger records and emits; a reporter draws. Each message is a `message`
event carrying the caller's arguments, so the reporter decides the colour, and
`registerSequence(plan)` emits `sequence` with the formats a `bber build` runs
and each one's tasks. Messages are recorded at every level: the reporter
decides what the level shows.

| Reporter   | The CLI uses it for | Output |
| ---------- | ------------------- | ------ |
| `progress` | a terminal, level ≤ 2 | one redrawing line (`⠹ [7/12] render`); errors and notices above it as they happen; warnings held until the build ends, each distinct one printed once with a count (`×11`); then `✓ Built web in 4.2s · 2 warnings` or `✗ Build failed at render (7/12) after 1.5s` |
| `plain`    | not a terminal (a pipe, CI, `TERM=dumb`), level ≤ 2 | what `progress` prints, without the redrawing line; never moves the cursor |
| `lines`    | `--log-level` ≥ 3, `--verbose`, `--debug`, `--quiet`; and anything that is not the CLI | a line per message, and from level 3 a line per finished task |

A build of several formats gets a counter per format, a `✓ <format> <time>`
line as each finishes, and `✓ Built N formats`. A command that registers no
sequence (`bber new`, `bber serve`) gets its messages as they happen.

While `progress` has its line drawn, it replaces `process.stdout.write` and
`process.stderr.write`, so that output it does not write (a child process
piped through, as epub-zipper does with `zip` and EPUBCheck) is printed above
the line instead of on the end of it. It puts them back when the build ends.
Anything that can go through the logger should: dart-sass and Calibre are
routed through `log.warn`/`log.info` for this reason. The spinner turns on an
unref'd timer, which never keeps the process alive.

## Levels and output

| Level | Name    | Shows                                                       |
| ----- | ------- | ----------------------------------------------------------- |
| 0     | quiet   | nothing                                                     |
| 1     | error   | errors, and notices (`log.notice`, "Build succeeded")       |
| 2     | warn    | warnings (the default)                                      |
| 3     | info    | a line per finished task, and a timestamp on every line     |
| 4     | verbose | `log.info`, and the stack trace of each warning and error   |
| 5     | debug   | the stack trace of each `log.info` line                     |

Every line is `[timestamp] label message`, the timestamp from level 3. The
labels are lowercase `error`, `warn` and `info`, as npm (from 10.6) and bun
print theirs (notices and info share `info`: they differ in when they are
shown, not in what they mean). They are padded to one width and differ in the
word itself, so the output reads without colour. In a message, `{N}` is
formatted as a byte count and `[text]` is highlighted; without colour the
brackets stay. Colour is off with `boringOutput`, and whenever chalk finds that
stdout cannot show it.

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
- `Logger` never writes. Output belongs to a reporter, and each reporter
  writes through its own `write`.
- No external logging library: the format and the events are the point.
