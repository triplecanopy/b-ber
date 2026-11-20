# TASK-158: Stop the logger flags from swallowing the next argument

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #794 — https://github.com/triplecanopy/b-ber/issues/794
**Scope:** cli

## Description

The logger's shorthand flags (`--quiet`, `--verbose`, `--debug`, `--summary`)
are read straight from `process.argv` by `src/lib/logger-options.ts`. That has
to happen before yargs runs: the logger must be configured before b-ber-lib's
`State` is imported, because `State` reads the project as it loads. The flags
are never declared to yargs, though. yargs-parser treats an undeclared
`--flag` followed by a word as `flag: word`, so the flag swallows the next
argument:

```
$ bber build --quiet epub
argv: { _: ['build'], quiet: 'epub' }     # yargs 13.3.2, the CLI's version
```

`epub` never reaches `argv._`, so `createBuildSequence` gets no formats and
builds **every** format. TASK-159's `knownFormats` check can't catch it,
because the word is already gone. The logger itself still reads `--quiet`
correctly from the raw argv, so the build is quiet and also builds far more
than was asked. The same happens to any positional that follows one of these
flags, e.g. `bber generate --verbose "Title"`.

`--no-color` is unaffected (yargs parses it as `color: false`). Neither is
`--log-level`, which is supposed to take a value.

Putting the flag after the positionals avoids it (`bber build epub --quiet`),
which is presumably why it has gone unnoticed.

Found by TASK-159 (#741) and recorded in its Findings as a follow-up.

## Subtasks

- [x] Choose between the two approaches below and record why (option 2)
- [x] Fix it, and add a test per flag showing that the following positional
      survives (`build --quiet epub` builds only epub; `check --verbose book`
      gets its project)
- [x] Keep `loggerOptions` reading the flags before yargs. The early
      configuration is still required
- [x] `--help` output: decide whether the logger flags are listed, and make it
      consistent across commands
- [x] Update `packages/b-ber-cli/README.md` / `AGENTS.md` if behaviour or help
      text changes

## Notes

Two approaches:

1. **Declare the flags to yargs as booleans** (and `log-level` as a number) at
   the top level, so they apply to every command. This is the small change,
   and the flags then show in help. `loggerArgvKeys` keeps stripping them from
   the config overrides in `build` and `new`.
2. **Remove the logger flags from argv before yargs sees them**
   (`yargs.parse(rest)`). `loggerOptions` becomes their only owner, and
   `loggerArgvKeys` and its stripping go away. yargs never has to know about
   them, but they disappear from help unless they're documented separately.

Option 2 fits the redesign epic's direction (a thin CLI where each concern
has one owner), but option 1 is the smaller diff. Either way, check
interaction with TASK-159's `noExtraArguments` and `knownFormats` checks.
Those checks are what turn a swallowed or leftover word into a visible error
once this is fixed.

This depends on TASK-159 (#741), which touches the same files. Start after it
merges.

## Findings

### Option 2: the flags never reach yargs (2026-11-20)

`src/lib/logger-options.ts` has one scan, `splitLoggerFlags`, that splits the
command line into the logger's flags and the rest. `loggerOptions` reads only
the flags. `app.ts` hands yargs only the rest, as `bber(args)` with
`.parse(args)` in place of `.argv`. In yargs 13, `.parse` with no callback runs
`_parseArgs` exactly as the `argv` getter does.

Chosen over declaring the flags to yargs because:
- each flag then has one owner, so the two parsers cannot disagree;
- `loggerArgvKeys`, and the loops in `build` and `new` that deleted those keys
  from the config overrides, are gone;
- `.strict()` would no longer have the logger's flags to reject, only the
  config overrides. That narrows what a later strict mode has to deal with.

Edge cases, each tested:
- `--log-level` takes the next word only when it is a whole number.
  `build --log-level epub` builds epub at the default level. Before, yargs
  swallowed the word.
- Nothing after `--` is treated as a flag.
- A flag that merely starts like one of these (`--quiet-ish`) is left alone.

Help: the top-level usage text (bare `bber`, `bber --help`) gains one line
listing the flags. A command's own `--help` does not list them, as before.
Listing them there would mean declaring them to every command's yargs instance
again, which this change exists to avoid. README.md did not mention them;
AGENTS.md is updated.

Replaced tests: the `loggerArgvKeys` test and the two handler tests "skips the
logger's flags" in build and new tested the removed workaround. App-level tests
in `app.test.js` cover the same ground through real yargs: the logger's flags
produce no "Invalid configuration option" warning. `b-ber-cli` stays at 100%.

Smoke test on a copy of the kitchen-sink fixture: `bber build --quiet web`
exits 0 and writes only `_builds-web/`.

