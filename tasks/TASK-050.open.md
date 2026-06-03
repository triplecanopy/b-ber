# TASK-050: CLI command inventory and handler test coverage

**Status:** not started
**Scope:** monorepo
**Priority:** high

## Description

Document every command and option exposed by the `bber` binary and verify that
handler-level tests exist for each one. The immediate motivation is the
`b-ber-logger` refactor: `log.error` calls `process.exit(1)`, and we need
confidence that changing that behaviour will not leave CLI processes running in
an error state. The current test suite only validates yargs structure — it does
not test that handlers call the right tasks, propagate errors, or exit cleanly.

## Command and Options Inventory

### Commands

| Command                        | Format                    | Key task call                         |
| ------------------------------ | ------------------------- | ------------------------------------- |
| `bber new <name>`              | `new.ts`                  | `tasks.init()`                        |
| `bber generate <title> [type]` | `generate.ts`             | `tasks.generate()`                    |
| `bber build [format]`          | `build.ts` (sub-commands) | `tasks.build<Format>()`               |
| `bber serve [reader\|web]`     | `serve.ts`                | `tasks.serve()`                       |
| `bber check [project]`         | `check.ts`                | `tasks.check()`                       |
| `bber cover`                   | `cover.ts`                | `tasks.cover()`                       |
| `bber deploy [builds...]`      | `deploy.ts`               | `tasks.deploy()`                      |
| `bber theme set\|list [name]`  | `theme.ts`                | `tasks.theme.*()`                     |
| `bber opf`                     | `opf.ts`                  | `tasks.opf()`                         |
| `bber xml`                     | `xml.ts`                  | (currently commented out in `app.ts`) |

### Shared config options (applied by `withConfigOptions`)

`--env`, `--theme`, `--src`, `--dist`, `--cache`, `--themes_directory`,
`--ignore`, `--base_path`, `--remote_url`, `--reader_url`, `--base_url`,
`--bucket_url`, `--private`, `--remote_javascripts`, `--remote_stylesheets`,
`--config`

Blacklisted (cannot be overridden at runtime): `ibooks_specified_fonts`,
`autoprefixer_options`, `downloads`, `ui_options`.

### Command-specific options

- `serve`: `--external/-e` (boolean)
- `deploy`: `--yes/-y` (boolean), `builds` (variadic positional)
- `generate`: `title` (required), `type` (optional: frontmatter/bodymatter/backmatter)
- `check`: `project` (optional positional)
- `theme`: `command` (required: set/list), `options` (optional positional)

## Current coverage gaps

The existing 8 test suites (`__tests__/commands/`) only validate yargs shape.
No handler is tested end-to-end:

- `build` — no handler tests at all
- `deploy` — no handler tests at all
- `check` — no handler tests at all
- Error propagation — no tests that a task rejection causes a non-zero exit
- Config blacklist — no tests that blacklisted keys are rejected in handlers
- `process.exit` — not asserted in any test

## Subtasks

- [ ] Write handler tests for `build` (each format sub-command)
- [ ] Write handler tests for `deploy` (including `--yes` flag)
- [ ] Write handler tests for `check`
- [ ] Add `process.exit` assertions to existing handler tests (mock `process.exit`, assert code 1 on task rejection)
- [ ] Test that config blacklist drops keys and warns
- [ ] Verify 75% statement coverage in `src/commands/` and `src/lib/`

## Notes

### Are these e2e tests?

No. Handler tests at this level are **unit/integration tests**: they mock
`b-ber-tasks` and `b-ber-lib/State`, then call the yargs handler function
directly and assert on the mocks. True e2e tests would spawn a child process
running `bber <command>` against a real project directory — that is a separate,
larger task and a different risk tier.

These tests belong in `packages/b-ber-cli/__tests__/commands/` (already
present for structure tests; add handler-level files alongside them).

### Should we create a testing package?

A shared `b-ber-test-utils` package would be worthwhile once multiple packages
need the same stubs (State singleton, b-ber-logger mock, mock filesystem). The
CLI tests already duplicate these mocks; b-ber-tasks tests do too. A dedicated
package would be TASK-052 or similar — scope it only when three or more
packages need the same test fixture code.

### Logger refactor safety

After the logger refactor (removing `process.exit` from `log.error`), run the
full `b-ber-cli` handler test suite to confirm error states propagate as
rejected Promises rather than hard exits. The tests added here are the gate for
that migration.
