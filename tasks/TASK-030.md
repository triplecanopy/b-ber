# TASK-030: Convert b-ber-tasks to TypeScript

**Status:** complete
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
  index.ts         (re-exports all task modules)
  serialize.ts     (sequences and runs tasks)
  task-handlers.ts (task registry: name → handler function)
```

## Subtasks

- [x] Audit `@types/*` needs across all 36 files before starting
- [x] Type `serialize.ts` and `task-handlers.ts` first
- [x] Convert all task modules
- [x] Add `declarations.d.ts` for untyped packages and subpath imports
- [x] Add tsdown build + update `package.json` `main`/`types` fields
- [x] `npx tsc --noEmit` passes with zero errors
- [x] `npm test` passes (44/44 tests)
- [x] `npm run build` succeeds (tsdown + copy.sh)

## Notes

Branch: `feat/ts-stage-3`

Key decisions made during conversion:

- All `@canopycanopycanopy/*` subpath imports (e.g. `b-ber-lib/State`,
  `b-ber-templates/Xhtml`) are declared in `src/declarations.d.ts` with
  inline stubs, since tsdown bundles packages to a single index and doesn't
  emit subpath files. No source import statements were changed.

- `jest.config.js` gained a `moduleNameMapper` pointing subpath imports
  to stub files in `__stubs__/` so Jest can resolve them before jest.mock
  factory calls replace them.

- `copy.sh` was updated to `mkdir -p dist/web dist/cover` before copying
  browser-side JS and font assets (tsdown's flat output doesn't create
  these subdirs).

- The `Reader` class constructor returns a Promise intentionally (old JS
  pattern). Suppressed with `// @ts-expect-error`.

- `web/Template.ts` and `web/index.ts` required the most annotation work:
  all static method params and module-level `let` variables needed explicit
  types.

Parent: [[TASK-029]]
