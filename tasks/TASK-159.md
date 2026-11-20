# TASK-159: Reject unknown CLI commands and list every build format

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #741 — https://github.com/triplecanopy/b-ber/issues/741
**Scope:** cli

## Description

TASK-050's handler tests (#517, PR #737) pinned three defects in how `bber`
handles its arguments, each with a test commented "Defect". TASK-046 fixed
the second (build and opf registered no yargs `fail` handler). This task does
the other two:

1. **Unknown commands do nothing.** `bber frobnicate`, and `bber xml` (whose
   command export is commented out), ran nothing, printed nothing and exited
   0. yargs is not in strict mode, and cannot be: yargs 13's `.strict()`
   would also reject the logger's flags and the config overrides, which are
   not declared to yargs, and it has no commands-only strict mode.
2. **`bber build --help` omits xml.** `build`'s command string was
   `build [|epub|mobi|pdf|reader|sample|web]`, although it registers an `xml`
   sub-command.

The same blind spot extends past the top level: every command ignored words
none of its positionals took. Fix that too, consistently, with no dependency
change.

## Subtasks

- [x] Reject an unknown top-level command: usage text, `Unknown command: <word>`,
      exit 1, through `src/lib/exit.ts`
- [x] Keep bare `bber` printing the usage text, and decide its exit status
- [x] Trace why the top-level `xml` command was disabled and whether
      `bber build xml` is supported
- [x] Make `build`'s usage line list xml, and every other format
- [x] Reject an unknown build format (`bber build ebup`, `bber build epub ebup`)
- [x] Reject left-over words in every other command (`bber opf extra`,
      `bber new My Project`)
- [x] Flip the "Defect" tests to the correct behaviour; test the new branches;
      keep b-ber-cli at 100% (lines, statements, branches, functions in `src/`)
- [x] Record what a yargs upgrade would cost
- [x] Update the CLI's AGENTS.md and README

## Notes

- Related: TASK-050 (the handler tests that found this), TASK-046 (item 2 of
  the issue, and the CLI's exit path).
- The approach is a yargs `.check` at each level, in
  `packages/b-ber-cli/src/lib/arguments.ts`. The CLI's AGENTS.md ("Unknown
  words") describes it for the next person adding a command.

## Findings

### Item 1: a `.check` at each level

yargs 13 runs a context's checks after it has moved the words the command's
positionals took out of `argv._`. What is left after the command's name is
what nothing took. So:

- **Top level (`app.ts`): `knownCommand`.** Registered not global, so it runs
  only when no command matched. It compares the first word with the first
  word of each registered command string. It fails into the existing
  top-level fail handler, which now shows the usage text and then goes
  through `fail` → `exitWithFailure`, exit 1.
- **Every command but build: `noExtraArguments`.** `bber opf extra` used to
  run opf; `bber new My Project` (unquoted) used to create a project called
  "My". Both now fail with `Unknown argument: …`, the command's help, exit 1.
  For `deploy` (variadic `[builds...]`) it can never fire, and is registered
  anyway so that every command is held to the same rule by one test.
- **build: `knownFormats`**, below.

Two alternatives were tried and set aside. A catch-all `*` command runs for
bare `bber` and `bber --help` as well as for an unknown word, in place of
demandCommand, so its handler would have to tell the three apart.
Validating `argv._[0]` after `.argv` returns works for the top level, but
cannot reach inside a command, whose handler has already started by then.
The checks use one mechanism at every level.

yargs passes a check's message to the fail handler **as both the message and
the error**. `fail` used to treat any truthy error as a failure in code and
skip the help; it now treats only an `Error` that way, so a check's message is
a usage error like any other.

### Bare `bber` exits 0

Help is off at the top level (`.help(false)`), so `bber`, `bber --help` and
`bber -h` all reach the fail handler the same way: demandCommand's "not
enough non-option arguments", with no error. The usage text is what each of
them asks for, and nothing failed, so the status stays 0. Exiting 1 would make
`bber --help` fail. A script never calls bare `bber` to do work, so nothing
can mistake the 0 for a build.

### Item 3: xml, and why build's positional went

History:

- `1629c691` (2019-03-27, "Intial work on cleanup for XML task") commented out
  both the top-level `xml` command (`app.js`, `cmd/index.js`) and
  `bber build xml`.
- `15db2e34` (2019-04-19, "Updates xml task") re-enabled `bber build xml`,
  adding `xml` to `b-ber-shapes-sequences` as `[...build, 'xml']`. The
  top-level command stayed off: the xml task needs the rendered build the
  sequence produces first, which a bare `bber xml` would not run.
- The command string, `build [|epub|mobi|pdf|reader|sample|web]`, dates from
  `820eadee` (2018-06-13, "Use positional syntax for build") and was never
  updated for xml.

So `bber build xml` is the supported path, and `bber build` with no format
already builds XML among the rest. xml stays a build format; the top-level
`xml` module stays unregistered (`src/commands/xml.ts` is kept and still
tested, as before).

Adding `xml` to the command string was not enough. The string's
`[|epub|…]` is a positional, and when no format sub-command matches it takes
the first word out of `argv._`, after which nothing can see it:
`bber build ebup` reached the handler as plain `bber build` and **built every
format**. So `build`'s command string is now just `build`, and its usage line
comes from the sequences (`Usage: bber build [epub|mobi|pdf|web|sample|reader|xml]`),
so it cannot leave a format out again. `bber build --help`'s "Commands:" list
already showed `build xml`; only the first line was out of date.

`knownFormats` is registered global, so it also runs in the format
sub-command that matched, which leaves later words in `argv._`
(`bber build epub ebup`). Several known formats are allowed:
`createBuildSequence` has always built `bber build epub web` as two formats in
turn, and that still works.

### What a yargs upgrade would cost (not done)

The CLI is on yargs 13.3.2 with `@types/yargs` 13. Current majors: 17.7.x
(CJS and ESM) and 18.x (latest 18.2.0).

- **`strictCommands()` arrived in 15.2.0.** It would not replace these
  checks: in 15.4 and 17 it reports every left-over word in a command's
  context as an unknown command, so it would also reject
  `bber build epub web`, and its message calls a stray word after `opf` an
  unknown *command*. `.strict()` still rejects undeclared flags, so the logger
  and config flags would have to be declared first.
- **14:** `yargs.parsed` and state of the last command no longer exposed;
  strict mode rejects extra positionals. **15:** yargs-parser throws on invalid
  config combinations; package.json-based parser config removed. **15.2:**
  duplicated booleans no longer become arrays. **16:** export map (deep
  imports blocked), `getProcessArgvWithoutBin` → `hideBin`, single-character
  aliases listed first in help (changes every `--help` text).
- **17:** `.argv`/`parse()` return a **promise when a handler is async**, and
  every handler here is (`exitOnFailure`). `bber()` and the test helper
  `runCli`, which read the parse result synchronously and rely on a
  synchronous throw from `fail`, would need reworking. `reset()` became
  private; coerce runs before validation.
- **18:** ESM only (`"type": "module"`, `exports` → `index.mjs`; engines
  `^20.19 || ^22.12 || >=23`). The tsdown CJS bundle could still `require()`
  it on every Node line in the root `engines` (require(esm), and `index.mjs`
  has no top-level await), but the singleton the CLI uses
  (`yargs.command(...)` on the import) is gone: it becomes
  `yargs(hideBin(process.argv))`. `@types/yargs` stops at 17.0.35, and 18's
  `exports` declare types only for its browser entry, so typing 18 is its
  own question.
- b-ber-lib also declares `yargs ^13.3.2`, and its source uses it only in a
  comment (the deprecated `fail`). That dependency looks vestigial, and is
  worth removing on its own.

An upgrade is a task of its own under Dependency health: 17 is the
reasonable target, and the async-parse change is most of the work.

### Left as it was

- **Undeclared logger flags take the next word.** `--quiet`, `--verbose`,
  `--debug` and `--summary` are not declared to yargs, so yargs-parser reads
  `bber build --quiet epub` as `quiet: 'epub'`, and builds every format.
  Putting the flag after the format avoids it.
  Declaring the flags as booleans at the top level would fix it, and changes
  how `loggerArgvKeys` strips them from config options. A follow-up.
- `bber xml` gets the plain `Unknown command: xml`, without a pointer to
  `bber build xml`. A special case for one retired name did not seem worth a
  branch.
- `serve`'s command string declares an `[opts]` positional that the handler
  never reads, so `bber serve reader anything` is accepted. Unchanged.
- Building the monorepo rewrites `packages/b-ber-resources/dist/`, which is
  tracked. Reverted here, not investigated.

## Notes on numbering

Filed first as TASK-157, which collided with the TASK-157 PRD merged in #791
("Build a new project without warnings", #790). Renumbered to TASK-159 before
merge. Issue #741 keeps its number.
