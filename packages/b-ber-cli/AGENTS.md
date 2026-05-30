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
| `src/index.js`              | Binary entry point; handles `--version` flag, then loads `app.js` |
| `src/app.js`                | Wires yargs commands and defines the custom help message          |
| `src/commands/index.js`     | Re-exports all command modules                                    |
| `src/commands/build.js`     | `bber build` — creates build sequences and runs tasks             |
| `src/commands/new.js`       | `bber new` — scaffolds a new project via `b-ber-tasks/init`       |
| `src/commands/generate.js`  | `bber generate` — creates a chapter file                          |
| `src/commands/serve.js`     | `bber serve` — starts a local preview server                      |
| `src/commands/check.js`     | `bber check` — validates project Markdown                         |
| `src/commands/cover.js`     | `bber cover` — generates a cover image                            |
| `src/commands/theme.js`     | `bber theme` — sets or lists themes                               |
| `src/commands/deploy.js`    | `bber deploy` — uploads builds to Amazon S3                       |
| `src/commands/opf.js`       | `bber opf` — generates the OPF package document                   |
| `src/lib/config-options.js` | Shared yargs option definitions and config-file parser            |
| `__tests__/commands/`       | Jest unit tests for each command                                  |

## Dev Commands

```bash
npm test        # jest unit tests
npm run build   # compile src/ → dist/ with Babel (production)
npm start       # run via babel-node without a compile step
npm run watch   # watch src/ and recompile on change
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All command handlers must remain thin: validate input, update `State`, call
  into `b-ber-tasks`. Avoid adding build logic directly in a command file.
- Config overrides passed via `--config` or CLI flags are validated against
  `state.config` keys before being applied; unknown or blacklisted keys are
  warned and discarded — preserve this pattern in new commands.
- The `blacklistedConfigOptions` set in `src/lib/config-options.js` must be
  kept in sync with any config keys that cannot be safely overridden at
  runtime.

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the
root AGENTS.md. No tasks are currently open. To add a task, create
tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
