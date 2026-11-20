# AGENTS.md — b-ber-cli

## What This Is

`b-ber-cli` is the command-line entry point for the b-ber build framework. It
installs a `bber` binary that parses user commands via yargs and delegates all
substantive work to `@canopycanopycanopy/b-ber-tasks`. Each command is a thin
yargs handler: it validates and normalises CLI flags (including an optional
`--config` YAML/JSON override file), updates the shared `State` singleton from
`@canopycanopycanopy/b-ber-lib`, and calls the appropriate task or sequence from
`b-ber-tasks`.

## Key Files

| File                        | Purpose                                                           |
| --------------------------- | ----------------------------------------------------------------- |
| `src/index.ts`              | Binary entry point: `--version`, configures the logger, installs the exit handlers, then loads `app.ts` |
| `src/app.ts`                | Wires yargs commands and defines the custom help message          |
| `src/commands/index.ts`     | Re-exports all command modules                                    |
| `src/commands/build.ts`     | `bber build` — creates build sequences and runs tasks             |
| `src/commands/new.ts`       | `bber new` — scaffolds a new project via `b-ber-tasks/init`       |
| `src/commands/generate.ts`  | `bber generate` — creates a chapter file                          |
| `src/commands/serve.ts`     | `bber serve` — starts a local preview server                      |
| `src/commands/check.ts`     | `bber check` — validates project Markdown                         |
| `src/commands/cover.ts`     | `bber cover` — generates a cover image                            |
| `src/commands/theme.ts`     | `bber theme` — sets or lists themes                               |
| `src/commands/deploy.ts`    | `bber deploy` — uploads builds to Amazon S3                       |
| `src/commands/opf.ts`       | `bber opf` — generates the OPF package document                   |
| `src/lib/arguments.ts`      | yargs checks that reject words no command, format or positional takes |
| `src/lib/config-options.ts` | Shared yargs option definitions and config-file parser            |
| `src/lib/exit.ts`           | The one place a failure becomes exit status 1; the yargs `fail` handler |
| `src/lib/logger-options.ts` | Reads the logger's flags, and takes them out of what yargs parses |
| `__tests__/commands/`       | Jest unit tests for each command                                  |
| `__stubs__/`                | Minimal stub modules for Jest `moduleNameMapper`                  |

## Errors and exit status

The CLI decides when the process exits; nothing below it does.
`b-ber-logger`'s `log.error` reports an error and returns it, without throwing
or exiting. Every call site in the tasks, grammars and libraries stops itself
by throwing what it returns (`throw log.error(...)`), or rethrowing it from a
promise chain's catch. What they throw ends up in `src/lib/exit.ts`:

- **`exitOnFailure(handler)`** wraps every command's handler. A rejection or
  throw from the handler exits 1. A handler must therefore **return or await
  its whole chain**: work that is started and not returned fails outside the
  wrapper.
- **`exitOnUncaughtFailure()`**, installed by `index.ts`, exits 1 on an
  uncaught exception or unhandled rejection, which is where a failure in a
  callback the chain does not see (a stream, a timer) ends up.
- **`fail`** is every command's yargs fail handler. A usage error shows the
  command's help and the error, and exits 1.
- All three go through **`exitWithFailure(err)`**: it reports `err` through
  `log.error`, which prints nothing for an error the logger has already
  reported, has the reporter end its output (`log.printFailure(1)`: the
  `✗ Build failed …` line during a build, `error exited with code 1`
  otherwise), and calls `process.exit(1)` at once, so that nothing queued behind the failure keeps
  running.
- **`exitCodeOnFailure()`**, also installed by `index.ts`, listens for the
  logger's `failure` event and sets `process.exitCode = 1`. It is a backstop
  for a call site that reports an error and fails to stop: the run then goes
  on, but still ends non-zero. It deliberately does **not** call
  `process.exit`. If it did, the sites would stop only when the CLI is
  listening, and a site that forgot its `throw` would look correct here and
  carry on anywhere else. Do not rely on it to stop anything.

`bber` with no command prints the usage text and exits 0, as does
`bber --help`, which is the same thing because help is off at the top level.

## Unknown words

yargs 13 ignores a word on the command line that nothing takes. `.strict()`
would report it, but would also reject the config overrides, which are not
declared to yargs; and yargs 13 has no strict mode
for words alone (`strictCommands` arrived in 15.2, and would also reject
`bber build epub web`, calling `web` an unknown command). So each level
registers a `.check`
from `src/lib/arguments.ts` (issue 741, TASK-159):

- **`app.ts`: `knownCommand`**, not global, so it runs only when no command
  matched: `bber frobnicate` shows the usage text, `Unknown command:
  frobnicate`, and exits 1.
- **Every command but build: `noExtraArguments`.** Checks run after yargs has
  moved the words the command's positionals took out of `argv._`, so anything
  after the command's name is left over: `bber new My Project` is `Unknown
  argument: Project`.
- **`build`: `knownFormats`**, global, so that it also runs in the format
  sub-command that matched (`bber build epub ebup`). Several known formats
  are allowed and build in turn. `build`'s command string has **no
  positional** for this reason: a positional would take the first unknown
  word out of `argv._`, and the handler would build every format. Its usage
  line lists the formats from `b-ber-shapes-sequences` instead.

A check that returns a message is a usage error. yargs passes that message to
the fail handler as the error too, so `fail` treats only an `Error` as a
failure in code. A new command registers `noExtraArguments` in its builder;
`__tests__/commands/index.test.js` holds every command to that.

## Logger configuration

`index.ts` reads `--quiet`, `--verbose`, `--debug`, `--log-level=N` (or
`--log-level N`), `--no-color` and `--summary` with `loggerOptions` and calls
`log.configure` **before** it imports `app.ts`. The import is dynamic for that
reason: the commands import b-ber-lib's `State`, which reads the project, and
can log or fail, while it loads.

`loggerOptions` also chooses the reporter (b-ber-logger's AGENTS.md describes
each): `progress` when stdout is a terminal and the level is the default or
lower, `plain` when it is not (or `TERM=dumb`), and `lines` from
`--log-level=3` up and at `--quiet`. `build` calls `log.registerSequence` with
each format it runs and that format's tasks, which is what the progress line
counts.

yargs never sees these flags. `splitLoggerFlags` separates them from the
rest of the command line, `loggerOptions` reads the first part, and `app.ts`
gives yargs only the second (`withoutLoggerFlags`). Undeclared, they used to
reach yargs, which took the word after one as its value: `bber build --quiet
epub` parsed as `quiet: 'epub'` and built every format (TASK-158).
`--log-level` takes the next word only when it is a number, and nothing after
`--` is a flag. The top-level usage text lists them; a command's own `--help`
does not.

## Dev Commands

```bash
npm test           # jest unit tests
npm run build      # compile src/ → dist/ with tsdown (CJS)
npm run typecheck  # tsc --noEmit type check without building
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All command handlers must remain thin: validate input, update `State`, call
  into `b-ber-tasks`. Avoid adding build logic directly in a command file.
- Wrap every handler in `exitOnFailure`, and register `fail` from
  `src/lib/exit.ts` in every builder. Never call `process.exit` from a command
  or catch an error to print it: let it reach the wrapper. A failure the CLI
  finds itself (`parseConfigFile`) is `throw log.error(...)`, as everywhere
  else.
- Config overrides passed via `--config` or CLI flags are validated against
  `state.config` keys before being applied; unknown or blacklisted keys are
  warned and discarded — preserve this pattern in new commands.
- The `blacklistedConfigOptions` set in `src/lib/config-options.ts` must be
  kept in sync with any config keys that cannot be safely overridden at
  runtime.
