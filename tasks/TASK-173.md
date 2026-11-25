# TASK-173: Delete State

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #836 — https://github.com/triplecanopy/b-ber/issues/836
**Scope:** b-ber-lib, b-ber-cli

## Description

The last step of [TASK-160](./TASK-160.md)'s plan.

When nothing imports `b-ber-lib/State`, delete it and the `AsyncLocalStorage`
shim. The CLI's dynamic import of `app.ts`, which only exists to delay
`State`'s import-time I/O, goes too. Together with [TASK-161](./TASK-161.md)'s package
consolidation (TASK-179) this is the 5.0 major.

## Subtasks

- [ ] Nothing imports `State`
- [ ] Delete `State` and the shim
- [ ] Remove the CLI's dynamic import
- [ ] Update the package AGENTS.md files that describe `State`

## Notes

- Depends on TASK-165 and TASK-177.
