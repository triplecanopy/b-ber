# TASK-030: Convert b-ber-tasks to TypeScript

**Status:** not started
**Scope:** b-ber-tasks
**Priority:** medium
**GitHub Issue:** #485 — https://github.com/triplecanopy/b-ber/issues/485

## Description

Convert `b-ber-tasks` from JavaScript to TypeScript. This is the largest
Stage 3 package: 36 source files (3769 LOC) containing one module per build
pipeline step, plus `serialize.js` (the task runner) and `task-handlers.js`
(the task registry).

**Source structure:**

```
src/
  clean/       copy/        cover/       deploy/
  epub/        footnotes/   generate/    init/
  inject/      loi/         mobi/        opf/
  pdf/         reader/      render/      sample/
  sass/        scripts/     serve/       validate/
  web/         xml/
  index.js         (re-exports all task modules)
  serialize.js     (sequences and runs tasks)
  task-handlers.js (task registry: name → handler function)
```

The largest individual files are `web/index.js` (439 LOC), `reader/index.js`
(272 LOC), and `cover/index.js` (252 LOC). Most task modules are 50–150 LOC.

## Subtasks

- [ ] Audit `@types/*` needs across all 36 files before starting
      (notable: `@types/cheerio` for web tasks, `@types/vinyl`, any
      Calibre/wkhtmltopdf shell-command types)
- [ ] Type `serialize.js` and `task-handlers.js` first — these are the
      shared infrastructure; task modules depend on them
- [ ] Convert task modules in dependency order: - Start with leaf tasks that have no imports from sibling tasks - `web/index.js` last within this package (most complex, uses cheerio)
- [ ] Type the `State` usages — `State` from `b-ber-lib` is now fully typed;
      use the exported `StateClass` type for function parameter types
- [ ] Add tsdown build + update `package.json` `main`/`types` fields
- [ ] Run `npm test` from root; check that serialize.test.js still passes
      (note: this test had mock path issues fixed in a prior session; verify
      mock target still matches the `src/task-handlers` import path)
- [ ] Update TASK-029 subtask checklist

## Notes

Branch: `feat/ts-stage-3`

`b-ber-tasks` is the package most likely to surface implicit-any issues. Task
handlers accept the State singleton as an ambient dependency (module-level
import, not passed as argument). This is fine for typing — `State` has an
exported type from Stage 1.

The `web/index.js` task uses `cheerio`. Cheerio v1 bundles its own types;
check the installed version before adding `@types/cheerio`.

Several task modules (pdf, mobi, epub) shell out to external tools (Calibre,
wkhtmltopdf, kindlegen). The shell invocations are via `child_process.exec`
or similar — type these as `string` input / `Promise<string>` output; no
attempt to type the external tool output schemas.

Per-package tsconfig pattern:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*.ts"]
}
```

Parent: [[TASK-029]]
