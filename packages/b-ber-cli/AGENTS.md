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
| `src/index.ts`              | Binary entry point; handles `--version` flag, then loads `app.ts` |
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
| `src/declarations.d.ts`     | `declare module` stubs for unresolvable subpath imports           |
| `__tests__/commands/`       | Jest unit tests for each command                                  |
| `__stubs__/`                | Minimal stub modules for Jest `moduleNameMapper`                  |

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
- Config overrides passed via `--config` or CLI flags are validated against
  `state.config` keys before being applied; unknown or blacklisted keys are
  warned and discarded — preserve this pattern in new commands.
- The `blacklistedConfigOptions` set in `src/lib/config-options.ts` must be
  kept in sync with any config keys that cannot be safely overridden at
  runtime.

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the
root AGENTS.md. No tasks are currently open. To add a task, create
tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
