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
| `src/lib/config-options.ts` | Shared yargs option definitions and config-file parser            |
| `src/lib/exit.ts`           | The one place a failure becomes exit status 1; the yargs `fail` handler |
| `src/lib/logger-options.ts` | Reads the logger's flags from the command line                    |
| `__tests__/commands/`       | Jest unit tests for each command                                  |
| `__stubs__/`                | Minimal stub modules for Jest `moduleNameMapper`                  |

## Errors and exit status

The CLI decides when the process exits; nothing below it does.
`b-ber-logger`'s `log.error` reports an error and throws it, and the tasks and
grammars rely on that to stop. What they throw ends up in `src/lib/exit.ts`:

- **`exitOnFailure(handler)`** wraps every command's handler. A rejection or
  throw from the handler exits 1. A handler must therefore **return or await
  its whole chain**: work that is started and not returned fails outside the
  wrapper.
- **`exitOnUncaughtFailure()`**, installed by `index.ts`, exits 1 on an
  uncaught exception or unhandled rejection, which is where a failure in a
  callback the chain does not see (a stream, a timer) ends up.
- **`fail`** is every command's yargs fail handler. A usage error shows the
  command's help and the error, and exits 1.
- All three go through **`exitWithFailure(err)`**: it prints `err` unless the
  logger already has (`log.isReported`), prints the closing
  `b-ber ERR! exited with code 1` line, and calls `process.exit(1)` at once,
  so that nothing queued behind the failure keeps running.

`bber` with no command prints the usage text and exits 0. An unknown command
still does nothing and exits 0 (issue 741: yargs 13 has no strict mode for
commands alone).

## Logger configuration

`index.ts` reads `--quiet`, `--verbose`, `--debug`, `--log-level=N` (or
`--log-level N`), `--no-color` and `--summary` with `loggerOptions` and calls
`log.configure` **before** it imports `app.ts`. The import is dynamic for that
reason: the commands import b-ber-lib's `State`, which reads the project, and
can log or fail, while it loads. These flags are not declared to yargs, so
`build` and `new` skip the keys yargs makes of them (`loggerArgvKeys`) when they
turn argv into config options.

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
  or catch an error to print it: let it reach the wrapper.
- Config overrides passed via `--config` or CLI flags are validated against
  `state.config` keys before being applied; unknown or blacklisted keys are
  warned and discarded — preserve this pattern in new commands.
- The `blacklistedConfigOptions` set in `src/lib/config-options.ts` must be
  kept in sync with any config keys that cannot be safely overridden at
  runtime.
