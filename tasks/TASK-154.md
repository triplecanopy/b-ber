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

- [ ] Agree the design above (open questions)
- [ ] Logger: stop writing to stdout; expose the recorded messages and events
      a reporter needs
- [ ] Reporters: progress, plain, verbose, quiet; chosen by the CLI from the
      flags and `process.stdout.isTTY`
- [ ] Tests for each reporter, including a non-TTY run
- [ ] The e2e CLI tests that read output still pass (or are updated)
- [ ] Before/after samples recorded here

## Notes

- Split from TASK-046 on 2026-11-15, on the user's decision to keep the event
  change and the output redesign apart.
