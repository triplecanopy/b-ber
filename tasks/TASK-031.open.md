# TASK-031: Convert b-ber-cli to TypeScript

**Status:** not started
**Scope:** b-ber-cli
**Priority:** medium

## Description

Convert `b-ber-cli` from JavaScript to TypeScript. This is the command-line
entry point for all `b-ber` commands: it parses arguments with `meow`,
dispatches to task handlers in `b-ber-tasks`, and is the last Node-only package
in the migration sequence.

**Source structure:**

```
src/
  app.js          (main export: sets up meow + command dispatch)
  commands/       (one file per command: build, epub, pdf, web, etc.)
  lib/            (CLI-specific utilities)
  index.js        (entry point: --version shortcut + dynamic require('./app'))
```

14 source files total.

## Subtasks

- [ ] Install `@types/meow` if not already present (or check meow version —
      recent meow ships its own types)
- [ ] Rename all `.js` → `.ts`; add type annotations
- [ ] The `src/index.js` entry uses `require('./app')` dynamically (intentional
      for startup performance). Keep as `require()` or convert to `import()` —
      document the decision in Notes below once decided.
- [ ] Add tsdown build + update `package.json` `main`/`types` fields
- [ ] Verify CLI still works end-to-end: `node dist/index.js --version` and one
      build command
- [ ] Run `npm test` from root
- [ ] Update TASK-029 subtask checklist

## Notes

Branch: `feat/ts-stage-3`

`b-ber-cli` is the top of the dependency graph. Converting it last means all
imported types (State, Config, task handlers, etc.) are already in place.
This package should have the fewest type annotation surprises.

The dynamic `require('./app')` in `src/index.js` is a startup-time optimization:
it avoids loading all command modules before the `--version` check is done.
When converting to TypeScript, this can remain as a CJS `require()` call
(TypeScript allows this with `esModuleInterop: true`), or be replaced with a
top-level `import` since the performance difference is negligible. Record the
decision in Notes once made.

meow version: check `package.json` to determine if `@types/meow` is needed or
if it ships its own types.

Per-package tsconfig pattern:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*.ts"]
}
```

Parent: [[TASK-029]]
