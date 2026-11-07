# TASK-050: CLI command inventory and handler test coverage

**Epic:** Unit test coverage
**GitHub Issue:** #517 — https://github.com/triplecanopy/b-ber/issues/517
**Scope:** monorepo

## Description

Document every command and option exposed by the `bber` binary and verify that
handler-level tests exist for each one. The immediate motivation is the
`b-ber-logger` refactor: `log.error` calls `process.exit(1)`, and we need
confidence that changing that behaviour will not leave CLI processes running in
an error state. The current test suite only validates yargs structure — it does
not test that handlers call the right tasks, propagate errors, or exit cleanly.

## Command and Options Inventory

Checked against `packages/b-ber-cli/src` on 2026-11-07. The first version of
this table named task calls that do not exist (`tasks.build<Format>()`,
`tasks.check()`, `tasks.theme.*()`) and placed the disabled `xml` command in
`app.ts`; the table below replaces it.

### Commands

Registered in `src/app.ts`, in this order: build, generate, opf, theme, serve,
new, cover, deploy, check.

| Command                          | File          | What the handler does                                                                 | yargs fail handler       |
| -------------------------------- | ------------- | ------------------------------------------------------------------------------------- | ------------------------ |
| `bber new <name>`                | `new.ts`      | filters config options, then `new tasks.init({ name, config }).start()`               | b-ber-lib `fail`         |
| `bber generate <title> [type]`   | `generate.ts` | `ensure()`, then `tasks.generate({ title, type })`                                    | b-ber-lib `fail`         |
| `bber build [format]`            | `build.ts`    | `ensure({ files })`, then per format: `state.reset()`, apply config options, `tasks.serialize(sequences[format])` | none (app.ts usage text) |
| `bber serve [build] [opts]`      | `serve.ts`    | `log.notice`, then `tasks.serve({ build, external })`                                 | b-ber-lib `fail`         |
| `bber check [project]`           | `check.ts`    | `tasks.validate({ project })`, project defaulting to `process.cwd()`                  | b-ber-lib `fail`         |
| `bber cover`                     | `cover.ts`    | `tasks.cover()`                                                                       | b-ber-lib `fail`         |
| `bber deploy [builds...]`        | `deploy.ts`   | the handler _is_ `tasks.deploy`, called with the parsed argv                          | b-ber-lib `fail`         |
| `bber theme <command> [options]` | `theme.ts`    | `ensure()`, then b-ber-lib `Theme.set(options)` / `Theme.list()` (not a task)         | b-ber-lib `fail`         |
| `bber opf`                       | `opf.ts`      | the handler _is_ `tasks.opf`                                                          | none (app.ts usage text) |
| `bber xml`                       | `xml.ts`      | the handler _is_ `tasks.xml`. **Not registered**: its export is commented out in `src/commands/index.ts`. XML output is `bber build xml`. | —                        |

`build` sub-commands: `''` (all formats), `epub`, `mobi`, `pdf`, `reader`,
`sample`, `web` and `xml`, all sharing one handler. With no format, every
sequence in `b-ber-shapes-sequences` runs in turn: epub, mobi, pdf, web,
sample, reader, xml. The command string `build [|epub|mobi|pdf|reader|sample|web]`
omits `xml`.

`src/index.ts` (the binary) prints the package version for `--version`/`-v`
and otherwise calls the yargs app.

### Shared config options (`withConfigOptions`, used by `build` and `new` only)

`--env`, `--theme`, `--src`, `--dist`, `--cache`, `--themes_directory`,
`--ignore`, `--base_path`, `--remote_url`, `--reader_url`, `--base_url`,
`--bucket_url`, `--private`, `--remote_javascripts`, `--remote_stylesheets`,
`--config`

`--config` names a `.json`/`.yaml`/`.yml` file whose keys are merged under the
flags (flags win). Each resulting key is then checked, in this order:

1. not a key of `state.config`: `log.warn('Invalid configuration option [%s]')`, dropped;
2. in `blacklistedConfigOptions`: `log.warn('Disallowed configuration option [%s]')`, dropped.

Blacklisted (cannot be overridden at runtime): `ibooks_specified_fonts`,
`autoprefixer_options`, `downloads`, `ui_options`.

`build` applies the surviving keys with `state.update('config.<key>')` after
each format's `state.reset()`. `new` passes them to the Initializer.

### Command-specific options

- `serve`: `build` (optional positional: reader/web; the task defaults to
  reader), `--external/-e` (boolean), `opts` (positional, unused)
- `deploy`: `--yes/-y` (boolean), `builds` (variadic positional: epub, mobi,
  reader, web, pdf, xml)
- `generate`: `title` (required), `type` (optional: frontmatter/bodymatter/backmatter)
- `check`: `project` (optional positional)
- `new`: `name` (required positional), plus the shared config options
- `theme`: `command` (required: set/list), `options` (optional positional: the theme name)

## Coverage

Before this task the 8 suites in `__tests__/` checked yargs shape, plus one
`serve` handler call and `parseConfigFile`. Every command now has a handler
test, `__tests__/commands/<command>.handler.test.js`. `__tests__/app.test.js`
runs the real yargs wiring in `app.ts` in-process, and `__tests__/index.test.js`
covers the binary. Shared fixtures are in `__tests__/helpers/cli.js`.

Statement coverage (root config, v8 provider):

| Directory                     | Before | After |
| ----------------------------- | ------ | ----- |
| `src/commands`                | 47.38% | 100%  |
| `src/lib`                     | 100%   | 100%  |
| `src` (`app.ts`, `index.ts`)  | 0%     | 100%  |

## Subtasks

- [x] Write handler tests for `build` (each format sub-command)
- [x] Write handler tests for `deploy` (including `--yes` flag)
- [x] Write handler tests for `check`
- [x] Add `process.exit` assertions to handler tests (mock `process.exit`, assert code 1 on task failure)
- [x] Test that config blacklist drops keys and warns
- [x] Verify 75% statement coverage in `src/commands/` and `src/lib/`
- [x] Handler tests for the remaining commands (new, generate, serve, cover, opf, theme, xml)

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

The tests use the real `b-ber-logger` and stub only `process.exit`
(`mockProcessExit` in `__tests__/helpers/cli.js`). The stub is a no-op, so code
after `log.error` keeps running, as it will once `log.error` returns. Every
assertion that depends on `log.error` exiting is
`expect(exit).toHaveBeenCalledWith(1)` beside a `TASK-046` comment: 14 of
them across the handler and app tests. When TASK-046 lands, those are the
assertions that fail. Each has to be repointed at whatever the CLI then does
to end with status 1.

What the tests pin down about exit status today:

- **The only route to status 1 is `log.error`.** Real tasks do not reject back
  to the CLI: `serialize` ends `.catch(log.error)`, and so do the Initializer
  (`new`), `cover` and `generate`. `parseConfigFile` (a missing or wrongly
  named `--config` file) calls `log.error` too. Nothing in `b-ber-cli` calls
  `process.exit` itself.
- **A rejection that does reach the CLI exits 0**, by one of four routes:
  `.catch(console.error)` (build, generate, theme); yargs, then the command's
  fail handler, which is b-ber-lib's `fail` and calls `process.exit(0)`
  (cover, deploy, serve); yargs, then app.ts's usage text and no exit (opf);
  or the promise is dropped and becomes an unhandled rejection (check; build
  from the second format on).

So if TASK-046 makes `log.error` emit an event, the CLI must listen for it and
exit 1, or every failure exits 0. If it makes `log.error` re-throw instead,
`serialize`'s `.catch(log.error)` rejects, and build failures take the routes
above: `console.error` and status 0 for the first format, an unhandled
rejection for the rest.

## Findings

Recorded, not fixed: TASK-050 adds tests only. Each is pinned by a test whose
comment says "Defect", so fixing one fails that test on purpose.

1. **`build` does not return its build chain.** The handler resolves before
   `ensure`/`serialize` run, so yargs never sees a build failure.
2. **`build` swallows rejections** with `.catch(console.error)`: status 0.
3. **`build` loses a rejection from the second format onward.** `run()` starts
   the next format inside `.then` without returning it, so that rejection is
   unhandled and never reaches `console.error`.
4. **`check` drops `validate`'s promise,** so a rejection is unhandled.
   Combined with #736 (the missing-project check tests an un-awaited
   `fs.pathExists`), a missing project fails with an unhandled `readdir`
   ENOENT instead of the intended message.
5. **`generate` and `theme` swallow rejections** with `.catch(console.error)`: status 0.
6. **`new` does not await `start()`**, which returns nothing anyway.
7. **b-ber-lib's `fail` exits 0.** It is the yargs fail handler for check,
   cover, deploy, generate, new, serve and theme, so both a rejected handler
   promise and a usage error (bad choice, missing positional) end with status 0.
8. **`build` and `opf` register no fail handler**, so their yargs failures
   print app.ts's generic usage text and never the error.
9. **Unknown commands do nothing.** yargs is not in strict mode, so
   `bber frobnicate` (and `bber xml`) runs nothing, prints nothing and exits 0.
10. **`--bucket_url`, `--remote_javascripts` and `--remote_stylesheets` are
    always dropped** as "Invalid configuration option" unless the project's
    config.yml already sets them. They are not keys of b-ber-lib's default
    `Config`, which `state.has` checks against. For `bber new`, which runs
    outside any project, they can never apply.
11. **`build`'s command string omits `xml`**, so `bber build --help` does not
    list it, although `bber build xml` works.
12. **`bber serve` with no build logs `Serving [b-ber-undefined]`.** The task
    defaults to reader; the notice does not know that. Cosmetic.

Test infrastructure:

- The existing `new.test.js` loaded the real `State`, whose constructor
  decides from `process.argv` whether to initialise a project in the working
  directory. In a Jest worker it skipped; under `--runInBand` it created
  `_project/_media` at the repo root and called `process.exit(1)`, which kills
  the run. It now mocks `State` like the other suites.
- `packages/b-ber-cli/jest.config.js` had no `testMatch`, so it would have run
  `__tests__/helpers/cli.js` as a suite. It now matches the root config.
- Pre-existing, not fixed: under the package's own config with `--runInBand`,
  `__tests__/lib/config-options.test.js` fails to load. Its YamlAdaptor stub
  requires b-ber-lib's built `dist`, which initialises `State`, which calls a
  `log.info` the test's logger mock lacks. The root config, which `npm test`
  and CI use, is unaffected.
