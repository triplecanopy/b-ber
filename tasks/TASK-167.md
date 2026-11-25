# TASK-167: Tag logger events with the target and report one line per target

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #830 — https://github.com/triplecanopy/b-ber/issues/830
**Scope:** b-ber-logger

## Description

The logger side of [TASK-160](./TASK-160.md)'s Plan step 4.

Today the logger's events carry no target, it has one `Timer`, and
`CompactReporter` tracks a single `currentBuild`. After this:

- **Events carry the target.** The pipeline gives the logger a way to look up
  the current target (`ctx.log`, and during the shim a provider that reads the
  `AsyncLocalStorage` store). The logger keeps no dependency on b-ber-lib.
- **One timer per target.**
- **`progress`** draws one redrawing line per target. Errors and notices print
  above the block, tagged with the target. A warning that several targets
  raise prints once, with its count and the targets. With one target, the
  output is exactly today's.
- **`plain`** prints each target's result line as it finishes, never redrawing.
- **`lines`** gains a target column after the label, only when more than one
  target is building.

## Subtasks

- [ ] Target on every event; a provider the pipeline installs
- [ ] A timer per target
- [ ] `progress`: the multi-target block, and warnings de-duplicated across targets
- [ ] `plain` and `lines` as above
- [ ] Single-target output unchanged (tests pin it)

## Notes

- Design: [TASK-160](./TASK-160.md), "Concurrency, failures and the logger", which has the
  layouts.
- Read `packages/b-ber-logger/AGENTS.md` first: the reporter captures stdout
  and stderr while its line is drawn.
- Lands with or before TASK-166.
