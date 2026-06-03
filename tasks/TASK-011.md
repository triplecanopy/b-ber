# TASK-011: Convert b-ber-logger to TypeScript

**Status:** complete
**Scope:** logger
**Priority:** medium
**GitHub Issue:** #496 — https://github.com/triplecanopy/b-ber/issues/496

## Description

Convert `b-ber-logger` to TypeScript. It is the smallest meaningful package
in Stage 1 of the TASK-002 migration — a single-purpose logging utility
consumed by every other package. Converting it early makes the type of the
logger importable throughout the monorepo once downstream packages are migrated.

**Depends on TASK-008. Can run in parallel with TASK-010 on the same branch.**

## Branch

`feat/ts-stage-1`.

## Subtasks

- [x] Audit `packages/b-ber-logger/src/` — document the public API surface
      (log levels, transport, output format, any configuration options).
- [x] Install TypeScript in the package.
- [x] Add `tsconfig.json` and `tsconfig.build.json` using the base template.
- [x] Rename `src/` files to `.ts`. Add type annotations:
  - `Logger` class: all 40+ instance properties and bound methods declared
    with `!:` (definite assignment assertions)
  - `LogEntry` and `LoggerSettings` interfaces defined in `index.ts`
  - `Timer.ts`: `TaskTime` interface, nullable hrtime properties, typed methods
  - Helper functions use `this: any` to avoid circular type dependency
  - `format.ts`: chalk access via `Record<string, (s: string) => string>`
- [x] Add `build` script; update `"main"` and `"types"` in `package.json`.
- [x] Run build, verify `dist/` output.
- [x] Run the existing tests (`npm test` in this package) — they must pass.
- [x] Run `npm test` from monorepo root — all 84 suites pass baseline.
- [x] Commit: `feat(logger): convert to TypeScript`

## Notes

- All 21 `src/*.js` files renamed to `*.ts`.
- `lodash` removed from runtime dependencies (was `lodash/has`, `lodash/isUndefined`,
  `lodash/isPlainObject` — all replaced with native equivalents: `in` operator,
  `=== undefined`, inline `isPlainObject` check).
- `chalk` (v2.4.2) kept in dependencies — it ships its own `.d.ts` files
  (`"types": "types/index.d.ts"` in its package.json), so no `@types/chalk` needed.
- `@types/node` available in root devDeps covers `EventEmitter`, `process.hrtime`,
  `process.stdout`, `util`.
- `listeners.ts`: `process.stdout.clearLine()` and `process.stdout.cursorTo()`
  cast to `NodeJS.WriteStream` to satisfy TypeScript TTY method signatures.
- Committed as `71663c94`. Run in parallel session with TASK-010.
- Test baseline unchanged: 37 failed (all pre-existing bootstrap), 47 passed.
- See TASK-009 notes for the tsdown / dist path pattern.
