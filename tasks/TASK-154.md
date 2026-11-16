# TASK-154: Package-manager-style build output

**Epic:** Node.js modernization
**GitHub Issue:** #778 — https://github.com/triplecanopy/b-ber/issues/778
**Scope:** logger, cli

## Description

`bber build` prints one line per message, and at `--log-level=3` one line per
finished task. Make the default output read like a `yarn` / `npm` / `pnpm`
install instead: a compact, redrawing progress view while the build runs, and
a one-line result at the end. The verbose levels keep today's line-by-line
output.

Depends on TASK-046 (#514), which makes the logger a single class that records
messages and emits events, and moves every exit decision to `b-ber-cli`. That
is what lets output become a separate concern.

### The hooks already exist

- `log.registerSequence(state, command, sequence)` (called by the CLI's
  `build`) gives the total number of tasks.
- `serialize` in b-ber-tasks calls `log.notify('start' | 'stop', task)` around
  every task and `log.notify('done', { state })` at the end. The logger turns
  them into `begin` / `end` / `done` events and times them.
- After TASK-046, `log.error` emits `failure`.

### Proposed design

Separate **recording** from **rendering**, as pnpm's default reporter and
Yarn Berry's reporters do. The logger keeps recording messages and task events
and stops writing to stdout itself. Reporters subscribe and render:

| Reporter | When | Output |
| -------- | ---- | ------ |
| progress | stdout is a TTY, level ≤ 2 | one redrawing line (`[12/31] ⠋ render`); warnings and errors printed above it as they happen; a final `✓ Built epub in 4.2s · 2 warnings` or `✗ Build failed: …` |
| plain | not a TTY (CI, pipes) | no cursor movement: one line per task or only the result; never `clearLine` (TASK-046 fixed a crash from exactly that) |
| verbose | `--verbose`, `--debug`, `--log-level ≥ 3` | today's line-by-line output, timestamps and stacks |
| quiet | `--quiet` | nothing |

Open questions to settle in this task:

- One line for a multi-format build (`build` with no format runs every format
  in turn): a line per format, or one overall counter?
- Does `--summary` survive, and in which reporter?
- Spinner and colour: hand-rolled with chalk (no new dependency), or a small
  library; see the root AGENTS.md preference for few dependencies.
- How warnings collapse: printed as they happen, or grouped at the end.

## Subtasks

- [x] Agree the design above (open questions; see Findings)
- [x] Logger: stop writing to stdout; expose the recorded messages and events
      a reporter needs
- [x] Reporters: progress, plain, verbose, quiet; chosen by the CLI from the
      flags and `process.stdout.isTTY` (verbose and quiet are one `lines`
      reporter: quiet is level 0 of it)
- [x] Tests for each reporter, including a non-TTY run
- [x] The e2e CLI tests that read output still pass (or are updated): none
      reads stdout; the golden-output test passes unchanged
- [x] Before/after samples recorded here

## Findings

### The open questions, as settled with the user

- **Several formats in one build.** A counter per format
  (`⠹ [3/12] reader render`), a `✓ reader 107ms` line as each finishes, then
  `✓ Built 3 formats in 0.4s`.
- **`--summary`** survives in every reporter, printed after the result (after
  each format's line in a multi-format build).
- **Spinner and colour** are hand-rolled with chalk; no new dependency. The
  spinner turns on an unref'd 80ms timer, so it never keeps the process alive.
- **Warnings** are held until the build ends, then printed once each with a
  count (`×11`) and totalled on the result line. Errors and notices print as
  they happen.
- **Labels** are lowercase `error`/`warn`/`info` with no `b-ber` badge, after
  npm (whose `npm ERR!` became `npm error` in 10.6) and bun, padded to one
  width. The user preferred this to the uppercase `WARN`/`ERR!` badges, which
  pnpm still uses. It applies to every reporter.

### Output that bypassed the logger

The redrawing line only works if nothing else writes to the terminal while it
is up. Three things did:

- **dart-sass** printed about 250 lines of deprecation warnings to stderr on
  every build, all from b-ber's own bundled themes. The sass task now gives
  dart-sass a `logger`: deprecations go to `log.info` (`--verbose`), a
  stylesheet's `@warn` to `log.warn`.
- **Calibre** (`EbookConvert`, mobi and pdf) wrote its output to stdout. It now
  goes to `log.info`.
- **epub-zipper** writes `zip`'s and EPUBCheck's output to the process streams
  and has no option to stop. While its line is drawn, `progress` replaces
  `process.stdout.write`/`process.stderr.write` so that such output is printed
  above the line, and restores them when the build ends. `zip`'s `adding:`
  lines still show; the user expects epub-zipper to be replaced or removed, so
  no follow-up was opened.

The outdated-`metadata.yml` notice was a `log.notice`, so it could not be
grouped; it is now a warning. The replacement it suggested was not valid YAML,
and now shows the `refines:` form `bber new` writes. The kitchen-sink fixture
used the outdated form; it was updated, and the golden-output test passes
unchanged for epub, web, reader and sample.

### Before/after samples

`bber build web` on the kitchen-sink fixture (with its `metadata.yml` updated
on both sides), in a terminal. Before, 204 lines, nearly all dart-sass:

```
b-ber info Preparing to run 12 tasks
Deprecation Warning [legacy-js-api]: The legacy JS API is deprecated and will be removed in Dart Sass 2.0.0.

More info: https://sass-lang.com/d/legacy-js-api
…  (about 185 lines of dart-sass deprecations and stack frames)
b-ber WARN render [epub:subchapter] is [deprecated]. substituting with [chapter]
b-ber WARN render [epub:pullquote] is [draft]. substituting with [chapter]
b-ber WARN render [epub:subchapter] is [deprecated]. substituting with [chapter]
…  (the same warning 9 more times)
b-ber WARN opf [figures-titlepage] was not declared in the TOC. Adding [figures-titlepage] to [web.yml]
b-ber WARN opf [notes] was not declared in the TOC. Adding [notes] to [web.yml]
b-ber info Build succeeded
```

After, while it runs, one line redrawn in place (`⠹ [ 7/12] render`), then:

```
warn  sass Deprecated mixin `break`. Use the `break-at` mixin
warn  render epub:subchapter is deprecated. substituting with chapter ×11
warn  render epub:pullquote is draft. substituting with chapter
warn  opf figures-titlepage was not declared in the TOC. Adding figures-titlepage to web.yml
warn  opf notes was not declared in the TOC. Adding notes to web.yml
✓ Built web in 224ms · 15 warnings
```

A failed build (a chapter referencing a missing image):

```
error Image not found _project/_images/does-not-exist.png
warn  sass Deprecated mixin `break`. Use the `break-at` mixin
warn  render epub:subchapter is deprecated. substituting with chapter ×2
warn  render epub:pullquote is draft. substituting with chapter
✗ Build failed at render (7/12) after 192ms · 4 warnings
```

`bber build web reader | cat` (plain: no colour, no cursor movement):

```
✓ web 220ms
✓ reader 111ms
warn  sass Deprecated mixin `break`. Use the `break-at` mixin ×2
warn  render [epub:subchapter] is [deprecated]. substituting with [chapter] ×22
warn  render [epub:pullquote] is [draft]. substituting with [chapter] ×2
warn  opf [figures-titlepage] was not declared in the TOC. Adding [figures-titlepage] to [web.yml]
warn  opf [notes] was not declared in the TOC. Adding [notes] to [web.yml]
✓ Built 2 formats in 333ms · 28 warnings
```

`--log-level=3` keeps a line per message and per task, with timestamps:

```
[2026-11-16T07:43:29.756Z] info  Preparing to run 12 tasks
[2026-11-16T07:43:29.758Z] info  clean done (0.296ms)
[2026-11-16T07:43:29.810Z] warn  sass Deprecated mixin `break`. Use the `break-at` mixin
[2026-11-16T07:43:29.931Z] info  sass done (170.024ms)
```

## Notes

- Split from TASK-046 on 2026-11-15, on the user's decision to keep the event
  change and the output redesign apart.
