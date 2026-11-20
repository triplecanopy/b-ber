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

- [ ] Choose between the two approaches below and record why
- [ ] Fix it, and add a test per flag showing that the following positional
      survives (`build --quiet epub` builds only epub; `generate --verbose
      Title` gets its title)
- [ ] Keep `loggerOptions` reading the flags before yargs. The early
      configuration is still required
- [ ] `--help` output: decide whether the logger flags are listed, and make it
      consistent across commands
- [ ] Update `packages/b-ber-cli/README.md` / `AGENTS.md` if behaviour or help
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
