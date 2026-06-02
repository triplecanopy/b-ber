# TASK-031: Convert b-ber-cli to TypeScript

**Status:** complete
**Scope:** b-ber-cli
**Priority:** medium
**GitHub Issue:** #486 — https://github.com/triplecanopy/b-ber/issues/486

## Description

Convert `b-ber-cli` from JavaScript to TypeScript. This is the command-line
entry point for all `b-ber` commands: it parses arguments with yargs,
dispatches to task handlers in `b-ber-tasks`, and is the last Node-only package
in the migration sequence.

**Source structure:**

```
src/
  app.ts          (main export: sets up yargs + command dispatch)
  commands/       (one file per command: build, epub, pdf, web, etc.)
  lib/            (CLI-specific utilities)
  index.ts        (entry point: --version shortcut + loads app.ts)
  declarations.d.ts (declare module stubs for subpath imports)
```

14 source files total.

## Subtasks

- [x] Rename all `.js` → `.ts`; add type annotations
- [x] Converted dynamic `require('./app')` to top-level `import bber from './app'`
      (tsdown bundles to a single file, so the startup-optimization rationale
      for the dynamic require no longer applies)
- [x] Add tsdown build + update `package.json` `main`/`types` fields
- [x] `npx tsc --noEmit` passes with zero errors
- [x] `npm test` passes (21/21 tests)
- [x] `npm run build` succeeds (tsdown → dist/index.js, CJS format)
- [x] Run `npm test` from root (84/84 suites)
- [x] Update TASK-029 subtask checklist

## Notes

Branch: `feat/ts-stage-3`

Key decisions:

- All `@canopycanopycanopy/b-ber-lib/*` subpath imports declared in
  `src/declarations.d.ts` with `declare module` stubs (same pattern as
  b-ber-tasks TASK-030).

- `jest.config.js` updated to use `@swc/jest` (replacing `babel-jest` with
  `rootMode: 'upward'`). Added `moduleNameMapper` pointing subpath imports
  to `__stubs__/` files. The `b-ber-lib-YamlAdaptor.js` stub wraps the real
  implementation from `b-ber-lib/dist/index.js` because the config-options
  test calls `YamlAdaptor.parse()` without mocking it.

- `cover` from `b-ber-tasks` is exported as the bound `.init` method (not as
  a class), so `cover()` is correct — `cover.init()` was wrong and would fail.

- `deploy` handler typed as `any` to avoid incompatibility with yargs'
  `ArgumentsCamelCase<any>` — the b-ber-tasks `deploy` function uses a named
  destructured parameter signature that TypeScript can't verify as assignable
  to the generic yargs handler type.

Parent: [[TASK-029]]
