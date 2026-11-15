# TASK-046: Refactor b-ber-logger

**Epic:** Node.js modernization
**GitHub Issue:** #514 — https://github.com/triplecanopy/b-ber/issues/514
**Scope:** b-ber-logger

## Description

`b-ber-logger` has two problems: the implementation is structurally awkward,
and the output format is inconsistent. Both need to be addressed together
since the refactor will touch every method.

### Implementation problems

**Bind-everything-in-constructor pattern.** Every method on the `Logger` class
is implemented as a standalone function in its own file, then imported and
bound to `this` in the constructor:

```ts
this.warn = warn.bind(this)
this.error = error.bind(this)
// ... ~30 more
```

This was a pre-class mixin pattern from ES5. In TypeScript it produces
`this: any` on every function (since there is no class context at definition
time), which eliminates all type safety and makes refactoring dangerous.
The 21 separate files for 808 lines of code create navigation friction with
no benefit — the files are too small to justify the split.

**`process.exit(1)` inside `log.error`.** The logger calls `process.exit`
when an error is logged. This makes it impossible to test error paths without
mocking `process.exit`, forces all callers to treat logging as a terminal
operation, and means any future caller that wants to handle errors (rather
than terminate) cannot use `log.error` at all.

**`process.argv` parsing in the constructor.** The logger reads and parses
`process.argv` at instantiation time to configure its log level and output
options. A logger should not know about CLI flags; that is the CLI's
responsibility. The logger should accept a config object.

**EventEmitter inheritance via Timer.** The `Logger` extends `Timer`, which
presumably extends `EventEmitter`. The `begin`/`end`/`done` event listeners
wired in `listeners.ts` are how the logger tracks build task progress. This
is not wrong per se, but the inheritance chain is opaque — it is not obvious
from reading `index.ts` that `Logger` is an EventEmitter.

### Output format problems

The current output mixes several visual styles:

- Some messages use the `b-ber ERR!` prefix (styled with chalk)
- Some use `b-ber info` prefix
- Indentation level is mutated via `incrementIndent` / `decrementIndent`
  side effects triggered by `begin`/`end` events
- The `notice` level, `warn` level, and `info` level are visually similar
- Error output is immediately followed by `process.exit`, so there is no
  post-error summary

The desired output is: clean, consistent prefix per level, readable without
colour (since some CI environments strip ANSI), and distinct enough that
`warn` vs `error` vs `notice` are immediately recognisable at a glance.

### Proposed refactor

1. **Consolidate into a single class file** (or at most two: `Logger.ts` and
   `Timer.ts`). Each log method becomes a proper class method — no external
   functions, no binding.

2. **Replace `process.exit` with an event or thrown error.** `log.error`
   should emit an `'error'` event (or re-throw) and let the caller decide
   what to do. `b-ber-cli` (the only top-level caller) can listen for the
   event and call `process.exit` there.

3. **Remove `process.argv` parsing from the constructor.** Accept a config
   object: `new Logger({ logLevel: 2, boringOutput: false })`. `b-ber-cli`
   is responsible for reading CLI flags and passing them to the logger.

4. **Improve the output format.** Define consistent level prefixes. Ensure
   the output is legible in no-colour mode. Consider whether `notice` and
   `info` can be collapsed into a single level.

5. **Keep the EventEmitter interface.** The `begin`/`end`/`done` event
   system is load-bearing for task progress tracking — do not remove it.
   Clarify the inheritance (`Logger extends EventEmitter` rather than via
   Timer if Timer only adds timing utils).

### Migration note

Every package that calls `log.error` and expects the process to exit will
need to handle the new error event. There are not many call sites — audit
before starting. The change to `configure()` (removing argv parsing) will
require `b-ber-cli` to pass settings explicitly.

## Subtasks

- [x] Audit all `log.error` call sites across the monorepo; count how many
      rely on `process.exit` being called implicitly (see *Call-site audit*)
- [x] Audit all `log.configure` / `log.settings` usage; understand what
      CLI flags currently reach the logger via argv (see *Findings*)
- [x] Rewrite `Logger` as a proper class with methods (no bind pattern)
- [x] Remove `process.argv` parsing; accept config object in constructor
- [x] Replace `process.exit` in `log.error` with event emission; update
      `b-ber-cli` to call `process.exit` on the error event — done as:
      `log.error` reports, emits `failure`, and returns the error; every
      call site stops itself with `throw log.error(...)`; the CLI exits 1 on
      whatever reaches its handlers, and its `failure` listener only sets
      `process.exitCode`. See *Findings* for why
- [x] Make every call site stop itself (see *Every call site*)
- [x] Consolidate the 21 source files into `Logger.ts` + `Timer.ts`
- [x] Improve output format: consistent level prefixes, no-colour legibility
- [x] Update `b-ber-logger` tests to cover the new interface
- [x] Run the test suite of every package that imports `b-ber-logger` to
      catch breakage (per the test propagation rule in AGENTS.md)

## Call-site audit

73 calls to `log.error` outside the logger, in 13 packages: b-ber-tasks 39,
b-ber-lib 12, the grammars 19 (attributes 2, audio-video 4, epigraph 1,
image 2, logo 1, media 2, pullquote 2, renderer 2, vimeo 3), b-ber-templates
1, b-ber-cli 2. Comments that mention it are not counted.

**All 73 relied on `log.error` ending the process.** 70 relied on it to stop
the work after them; the other 3 (the last `.catch(log.error)` of the `init`,
`generate` and `deploy` tasks, after which nothing runs) relied on it only for
the non-zero exit status. One more, in the reader task, had its own
`process.exit(1)` after the call as well.

| Form | Sites | What depended on the exit | What stops it now |
| ---- | ----- | ------------------------- | ----------------- |
| Guard: `if (bad) log.error(...)`, then code that uses the bad value (missing image, duplicate id, missing `source`, no stylesheets, a bad config file …), including the helpers whose whole job is to report (`throwMissingIDError`, Yaml `typeCheck`) | 37 | the code after the guard | `if (bad) throw log.error(...)`: ends the function; it propagates out of the markdown-it render, or rejects the task's chain |
| `catch (err) { log.error(...) }` (Theme `set`, YamlAdaptor `load`, reader) | 3 | the code after the `try` | `catch (err) { throw log.error(...) }`: leaves the `catch` block |
| `.catch(log.error)` on a promise chain | 33 | the chain resolving with `undefined` and the next task, format or step running | `.catch((err) => { throw log.error(err) })`: the chain stays rejected; an outer one reports it again without printing it again |

Every site now stops by its own `throw`, which stops it where the exit did.
None became a `return`, and no final catch was deleted: every guard, even the
four in markdown-it `validate` callbacks that had a `return false` after the
call, is a throw. A `return false` there tells markdown-it "not this
directive" and rendering would go on. The final catches of the `init`,
`generate` and `deploy` chains, which could have been deleted because the CLI
wrapper reports a rejection, rethrow like the rest, so the error is recorded
and emitted where it happens, for any caller. The `return false` and one assignment that followed the
call in those four (epigraph, image, pullquote, renderer) could never run and
are removed.

What had to change around them:

- **Something has to turn the throw into exit status 1.** `b-ber-cli` wraps
  every command handler (`exitOnFailure` in `src/lib/exit.ts`), and the
  handlers now return or await their whole chain: build, check, generate,
  theme and new did not. `Initializer#start` now returns its promise.
- **A throw that escapes every chain** — the cover task's
  `encodeJPEGToStream(...)` catch is returned from a font-loading
  callback whose result nothing reads, and anything thrown from a stream or
  timer callback — becomes an unhandled rejection or uncaught exception. The
  CLI exits 1 on both through the same path (`exitOnUncaughtFailure`). Today
  Node already exits 1 on both, so this changes only what is printed.
- **Nothing may catch the throw and carry on.** Every `try`/`catch` and
  `.catch()` that could sit above a call was checked: State's constructor and
  `loadTheme`, `getImageDimensions` and `resolveIntersectingUrl` in utils,
  Theme `set`, YamlAdaptor `load`, the markdown-renderer's `highlight`, the
  reader task's two, deploy's `ensureAwsCli` and sass's `copyThemeAssets`.
  None wraps a `log.error` call or code that makes one, other than to report
  it. The three that did swallow were the CLI's own `.catch(console.error)`
  in build, generate and theme, which are gone.
- **A failure while loading.** b-ber-lib's State reads the project when it
  is first imported, and a failing guard there throws during the import.
  `index.ts` therefore imports the commands dynamically, after the exit
  handlers are installed, and a malformed `config.yml` exits 1 through the
  logger rather than with Node's stack dump.
- Removed the reader task's unreachable `process.exit(1)`, and Opf's `| void`
  allowance for a manifest or navigation that resolved to `undefined` after
  an unexited failure.

`log.error` returns `Error`. The `throw` at each site is what lets TypeScript
treat the code after it as unreachable and narrow on it (deploy's region no
longer needs a cast), and a catch that only throws is inferred as `never`, so
the chain keeps its resolved type instead of adding `void`.

**Call sites the table missed: none.** Searched for `log.error` passed as a
callback or destructured, `log['error']`, other import names for the logger,
`log.report`, and plain-JS sources; the only other caller is the CLI's
`exitWithFailure`, which reports and exits.

### Every call site

The 73 calls on this branch (TASK-046-logger), generated 2026-11-15. Line numbers can differ by a few from `main`, where the same calls exist. Form is what stops after the call once `log.error` stops ending the process: **guard** — the rest of the function runs with the bad value; **catch** — the code after the `try` runs; **chain** — `.catch(log.error)` resolves the chain with `undefined`, so every later `.then` (the next task, format or step) runs. Guards 37, catch 3, chain 33.

Every one is done, on TASK-046-logger-events. Line numbers are from `8f78e45b`, before the change. **Now** is how the site stops: **throw** is `throw log.error(...)` (guards, and `catch` blocks), **rethrow** is `.catch((err) => { throw log.error(err) })`. 40 throw, 33 rethrow; no site became a `return`, and no final catch was deleted (see above).

**b-ber-cli** (2)

| Done | Site | Form | Call | Now |
| ---- | ---- | ---- | ---- | ---- |
| [x] | `b-ber-cli/src/lib/config-options.ts:99` | guard | `log.error('Could not find config at [${configPath}]')` | throw |
| [x] | `b-ber-cli/src/lib/config-options.ts:103` | guard | `log.error('Config file must have a .json or .yaml/.yml file extension')` | throw |

**b-ber-grammar-attributes** (2)

| Done | Site | Form | Call | Now |
| ---- | ---- | ---- | ---- | ---- |
| [x] | `b-ber-grammar-attributes/src/index.ts:251` | guard | `log.error('No directive provided: ${fileName}:${lineNumber}')` | throw |
| [x] | `b-ber-grammar-attributes/src/index.ts:255` | guard | `log.error('Invalid directive: [${genus}] at ${fileName}:${lineNumber}')` | throw |

**b-ber-grammar-audio-video** (4)

| Done | Site | Form | Call | Now |
| ---- | ---- | ---- | ---- | ---- |
| [x] | `b-ber-grammar-audio-video/src/helpers.ts:27` | guard | `log.error('bber-directives: Poster image for [${type}] does not exist')` | throw |
| [x] | `b-ber-grammar-audio-video/src/helpers.ts:39` | guard | `log.error(` | throw |
| [x] | `b-ber-grammar-audio-video/src/index.ts:80` | guard | `log.error(` | throw |
| [x] | `b-ber-grammar-audio-video/src/index.ts:117` | guard | `log.error(err)` | throw |

**b-ber-grammar-epigraph** (1)

| Done | Site | Form | Call | Now |
| ---- | ---- | ---- | ---- | ---- |
| [x] | `b-ber-grammar-epigraph/src/index.ts:60` | guard | `log.error('[${context.fileName}.md] <epigraph> Malformed directive.')` | throw |

**b-ber-grammar-image** (2)

| Done | Site | Form | Call | Now |
| ---- | ---- | ---- | ---- | ---- |
| [x] | `b-ber-grammar-image/src/index.ts:55` | guard | `if (!fs.existsSync(asset)) log.error('Image not found [${asset}]')` | throw |
| [x] | `b-ber-grammar-image/src/index.ts:82` | guard | `log.error(` | throw |

**b-ber-grammar-logo** (1)

| Done | Site | Form | Call | Now |
| ---- | ---- | ---- | ---- | ---- |
| [x] | `b-ber-grammar-logo/src/index.ts:41` | guard | `log.error(` | throw |

**b-ber-grammar-media** (2)

| Done | Site | Form | Call | Now |
| ---- | ---- | ---- | ---- | ---- |
| [x] | `b-ber-grammar-media/src/helpers.ts:19` | guard | `log.error(message)` | throw |
| [x] | `b-ber-grammar-media/src/helpers.ts:28` | guard | `log.error(message)` | throw |

**b-ber-grammar-pullquote** (2)

| Done | Site | Form | Call | Now |
| ---- | ---- | ---- | ---- | ---- |
| [x] | `b-ber-grammar-pullquote/src/index.ts:46` | guard | `log.error(` | throw |
| [x] | `b-ber-grammar-pullquote/src/index.ts:111` | guard | `log.error(` | throw |

**b-ber-grammar-renderer** (2)

| Done | Site | Form | Call | Now |
| ---- | ---- | ---- | ---- | ---- |
| [x] | `b-ber-grammar-renderer/src/index.ts:46` | guard | `log.error(` | throw |
| [x] | `b-ber-grammar-renderer/src/index.ts:68` | guard | `log.error('Duplicate [id] [${id}]. [id] must be unique at [${location}]')` | throw |

**b-ber-grammar-vimeo** (3)

| Done | Site | Form | Call | Now |
| ---- | ---- | ---- | ---- | ---- |
| [x] | `b-ber-grammar-vimeo/src/helpers.ts:24` | guard | `log.error(message)` | throw |
| [x] | `b-ber-grammar-vimeo/src/helpers.ts:74` | guard | `log.error('bber-directives: Poster image for [${type}] does not exist')` | throw |
| [x] | `b-ber-grammar-vimeo/src/index.ts:59` | guard | `log.error(` | throw |

**b-ber-lib** (12)

| Done | Site | Form | Call | Now |
| ---- | ---- | ---- | ---- | ---- |
| [x] | `b-ber-lib/src/EbookConvert.ts:82` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-lib/src/State.ts:329` | guard | `log.error('Cannot add [${value}] to [state.${prop}]')` | throw |
| [x] | `b-ber-lib/src/State.ts:349` | guard | `log.error('Cannot remove [${value}] from [state.${prop}]')` | throw |
| [x] | `b-ber-lib/src/State.ts:483` | guard | `log.error('Project directory [${projectDir}] does not exist')` | throw |
| [x] | `b-ber-lib/src/Theme.ts:91` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-lib/src/Theme.ts:179` | catch | `log.error('Could not load theme [${name}]')` | throw |
| [x] | `b-ber-lib/src/Theme.ts:187` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-lib/src/Yaml.ts:69` | guard | `if (errors.length) log.error(errors)` | throw |
| [x] | `b-ber-lib/src/YamlAdaptor.ts:135` | catch | `log.error(err)` | throw |
| [x] | `b-ber-lib/src/utils/index.ts:155` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-lib/src/utils/index.ts:294` | guard | `log.error('bber-directives: Poster image for [${type}] does not exist')` | throw |
| [x] | `b-ber-lib/src/utils/index.ts:347` | guard | `log.error(` | throw |

**b-ber-tasks** (39)

| Done | Site | Form | Call | Now |
| ---- | ---- | ---- | ---- | ---- |
| [x] | `b-ber-tasks/src/clean/index.ts:27` | chain | `export default () => clean().catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/container/index.ts:46` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/copy/index.ts:65` | chain | `return Promise.all(promises).catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/cover/index.ts:189` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/cover/index.ts:252` | guard | `log.error('Cover image listed in metadata.yml cannot be found')` | throw |
| [x] | `b-ber-tasks/src/cover/index.ts:272` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/cover/index.ts:279` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/deploy/index.ts:132` | guard | `log.error(` | throw |
| [x] | `b-ber-tasks/src/deploy/index.ts:142` | guard | `log.error('[bucketURL] must be set in config.yml to deploy the project')` | throw |
| [x] | `b-ber-tasks/src/deploy/index.ts:232` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/epub/index.ts:16` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/footnotes/index.ts:52` | chain | `return this.writeFootnotes().catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/generate/index.ts:37` | guard | `log.error('_markdown${path.sep}${fileName} already exists, aborting')` | throw |
| [x] | `b-ber-tasks/src/generate/index.ts:78` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/init/index.ts:32` | guard | `log.error('Project [${name}] already exits, aborting')` | throw |
| [x] | `b-ber-tasks/src/init/index.ts:83` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/inject/index.ts:148` | chain | `return writeAll(fileObjects).catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/loi/index.ts:119` | chain | `return createLOIAsSingleHTMLFile().catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/loi/index.ts:123` | chain | `return createLOILeader().then(createLOIAsSeparateHTMLFiles).catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/mobi/index.ts:36` | chain | `}).catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/mobi/mobi-css.ts:94` | chain | `).catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/opf/ManifestAndMetadata.ts:111` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/opf/Navigation.ts:129` | guard | `log.error(message)` | throw |
| [x] | `b-ber-tasks/src/opf/Navigation.ts:229` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/opf/Opf.ts:34` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/pdf/index.ts:160` | chain | `}).catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/reader/index.ts:52` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/reader/index.ts:102` | guard | `log.error(` | throw |
| [x] | `b-ber-tasks/src/reader/index.ts:118` | catch | `log.error('` | throw |
| [x] | `b-ber-tasks/src/render/index.ts:24` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/render/index.ts:31` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/render/index.ts:59` | chain | `return promises.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/sass/index.ts:55` | guard | `if (chunks.length < 1) log.error('No readable stylesheets were found')` | throw |
| [x] | `b-ber-tasks/src/sass/index.ts:206` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/scripts/index.ts:70` | chain | `const scripts = () => ensureDir().then(write).catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/serialize.ts:58` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/validate/index.ts:15` | guard | `log.error('Project path does not exist, aborting')` | throw |
| [x] | `b-ber-tasks/src/web/index.ts:438` | chain | `.catch(log.error)` | rethrow |
| [x] | `b-ber-tasks/src/xml/index.ts:56` | chain | `return parseHTMLFiles(files).then(writeXML).catch(log.error)` | rethrow |

**b-ber-templates** (1)

| Done | Site | Form | Call | Now |
| ---- | ---- | ---- | ---- | ---- |
| [x] | `b-ber-templates/src/figures/index.ts:42` | guard | `log.error(` | throw |

## Findings

**Why the logger emits and each site throws.** A first version had
`log.error` report and then throw, which stopped every site without touching
it. It was reworked on the decision that a logger should log, not throw:
whether to stop is the caller's business, and a logging call that ends the
code path is the same surprise `process.exit` was, only smaller. So
`log.error` records, prints, emits `failure`, and returns the error, and each
site's own `throw log.error(...)` stops it, visibly, where it is.

An event that the CLI answers with `process.exit` was rejected for the same
reason the throw was first chosen: the sites would stop only inside the CLI.
Anywhere else (tests, scripts, a future programmatic caller) nobody listens,
and every one of the 70 sites above would carry on. The CLI's `failure`
listener therefore only sets `process.exitCode = 1`: a backstop that makes a
site which logs and forgets to stop end the run non-zero, without making it
look as if it stopped. The event is `failure`, not `error`: an `'error'` event
on an EventEmitter with no listener throws.

`log.report`, added in the first version to report without the throw, is now
the same thing as `log.error`, and is removed.

**What reached the logger through argv.** The constructor split every argv
entry on `=` and read `--quiet`, `--verbose`, `--debug`, `--summary`,
`--no-color` and `--log-level=N` (only that form). `log.configure()` and
`log.settings` were used only inside the logger. The flags were never
declared to yargs, so `build` and `new` turned them into config options and
warned about each: `--verbose` gave "Invalid configuration option [verbose]",
`--log-level=3` gave two warnings, `--no-color` one for `[color]`. Other argv
readers, left alone: State's `skipInitialization` (`--help`, `-h`,
`--version`, `-v`, `new`) and the epub, mobi and pdf tasks' `--no-compile`.

**Bugs found and fixed on the way:**

- At log level 3 or above, the task-done line called
  `process.stdout.clearLine`, which does not exist unless stdout is a TTY: a
  `--verbose` or `--log-level=3` build piped anywhere (CI, `| tee`) crashed
  at the end of its first task.
- Without colour, `[text]` lost its brackets, so "Applying configuration
  option [env]:[prod]" printed as "env:prod". chalk also turns colour off
  when stdout is not a TTY, so this was every CI log, not only `--no-color`.
- `log.error` used only its first argument, so `log.error('x [%s]', y)`
  printed a literal `%s`.
- `notice` printed under `--quiet`.
- `floatFormat` threw on a number of 12 digits or more.
- `bber` usage errors exited 0 without printing the error, and build/opf
  printed the generic usage text instead (issue 741, item 2).

**Issue 740** (CLI failures exit 0) is fixed for every route the issue lists:
`.catch(console.error)` (removed), b-ber-lib's `fail` exiting 0 (replaced by
the CLI's `fail`, which exits 1), dropped promises in check and build's
later formats (returned now), and build's handler resolving early (it awaits
its chain). **Issue 744** (`log.error` does not stop the build under
`--quiet`) is fixed: the level decides only printing, and
`bber build epub --quiet` on the kitchen-sink fixture exits 1, printing
nothing from the logger. **Issue 741** is fixed only for item 2. Items 1
(unknown commands exit 0) and 3 (`build --help` omits xml) are yargs
configuration unrelated to exiting, and left: yargs 13's `.strict()` would
also reject the undeclared logger and config flags, and it has no
commands-only strict mode.

**Removed from the logger's API**, all unused outside it: `indent`,
`incrementIndent`, `decrementIndent`, `incrementCounter`,
`decrementCounter`, `counter`, `getContext`, `wrap`, `bind`, `printWarnings`,
`printErrors`, `settings`, and the fields behind them. Indentation was always
zero (`increment: 0`). Added: `isReported`, `printFailure`, and the `failure`
event. `log.error` returns `Error` instead of `void`.

**Tests that only passed because the logger was mocked.** Many packages mock
`b-ber-logger`, and their `log.error` returned `undefined` and stopped
nothing, so several tests asserted that a failing path carried on: that
`validate` returned `false` for a figure, pullquote or block directive with no
id, that `new Yaml('nonexistent-schema', true)` did not throw, that
`YamlAdaptor.load` of a missing file returned `[]`. In a real build each of
those stopped the process. The mocks now return an Error, as the real
`log.error` does, and the tests expect the throw. Two such paths, found on
the way and left alone: b-ber-grammar-attributes fails a draft directive such
as `abstract` as "Invalid directive" before the substitution with `chapter`
below it can run, since `ALL_DIRECTIVES` leaves the draft ones out; and
b-ber-grammar-image's `MARKER_OPEN_RE` is not anchored at the start, so any
directive name ending in `figure` (`notafigure:foo`) is validated as a figure
and fails for want of a source.

**Left as they were:** `log.debug` and `log.trace` are still no-ops (making
them print at level 5 would add every grammar's debug line to `--debug`
output). The deploy task still calls `process.exit(0)` when the AWS CLI is
missing or the prompt is declined. The check command still exits 0 when the
validator finds invalid Markdown: b-ber-validator reports with `console.log`
and never fails (#736 covers its missing-project check). b-ber-lib's `fail`
is unused and marked deprecated rather than removed, as it is public API.

## Notes

Branch: dedicated feature branch off `feat/upgrades` (e.g. `feat/logger-refactor`).

The refactor does not need to change the external API (`log.warn(msg)`,
`log.error(msg)`, etc.) — only the implementation and the `process.exit`
side effect. Callers should not need to update their `log.*` call sites,
only the error-handling setup in `b-ber-cli`. (Superseded: every `log.error`
call site now stops itself with a `throw`; see *Findings*.)

Do not use an external logging library (winston, pino, etc.) — the custom
format and EventEmitter integration are intentional design choices that
would be lost in a library wrapper.

Related: [[TASK-011]] (original logger TS conversion — the bind pattern is inherited from that work)
