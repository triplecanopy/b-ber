# TASK-011: Convert b-ber-logger to TypeScript

**Status:** not started
**Scope:** logger
**Priority:** medium

## Description

Convert `b-ber-logger` to TypeScript. It is the smallest meaningful package
in Stage 1 of the TASK-002 migration — a single-purpose logging utility
consumed by every other package. Converting it early makes the type of the
logger importable throughout the monorepo once downstream packages are migrated.

**Depends on TASK-008. Can run in parallel with TASK-010 on the same branch.**

## Branch

`feat/ts-stage-1`.

## Subtasks

- [ ] Audit `packages/b-ber-logger/src/` — document the public API surface
      (log levels, transport, output format, any configuration options).
- [ ] Install TypeScript in the package.
- [ ] Add `tsconfig.json` and `tsconfig.build.json` using the base template.
- [ ] Rename `src/` files to `.ts`. Add type annotations:
  - Logger method signatures (level, message, optional metadata)
  - Any configuration interface (log level enum, transport type)
  - Export the logger instance with an explicit interface
- [ ] Add `build` script; update `"main"` and `"types"` in `package.json`.
- [ ] Run build, verify `dist/` output.
- [ ] Run the existing tests (`npm test` in this package) — they must pass.
      Note: TASK-001 in this package (adding real tests) can run before or after
      this conversion — the tasks are independent.
- [ ] Run `npm test` from monorepo root — all 65 suites must pass.
- [ ] Commit: `chore(logger): convert to TypeScript`

## Notes

- `b-ber-logger` is consumed by almost every package via
  `@canopycanopycanopy/b-ber-logger`. The typed exports will propagate to
  those consumers once they are converted in later stages.
- If the logger exports a singleton instance, give it an explicit interface
  rather than relying on inference, so consumers get a stable documented API.
- See TASK-002 Stage 1 for the full migration sequence.
