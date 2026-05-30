# TASK-008: Set up shared TypeScript infrastructure

**Status:** not started
**Scope:** monorepo
**Priority:** high

## Description

Establish the shared TypeScript configuration that all per-package migrations
will extend. This is a prerequisite for every task in the TASK-002 Stage 1–3
migration sequence. The work here is small but must be done before any package
starts converting.

## Branch

`feat/ts-stage-1`. All Stage 1 conversion tasks (TASK-009 through TASK-012)
work on this branch. Each package conversion is one commit. Merge to
`ai-refactor` once the full stage is complete and all tests pass.

## Subtasks

- [ ] Create `git checkout -b feat/ts-stage-1`
- [ ] Rename root `tsconfig.json` → `tsconfig.base.json`:
  ```bash
  git mv tsconfig.json tsconfig.base.json
  ```
- [ ] Populate `tsconfig.base.json`:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "module": "commonjs",
      "target": "es2020",
      "lib": ["es2020"],
      "esModuleInterop": true,
      "skipLibCheck": true,
      "declaration": true,
      "declarationMap": true,
      "sourceMap": true,
      "include": []
    }
  }
  ```
  Note: `target` raised from `es6` to `es2020` — matches the Node ≥ 20
  engine target that TASK-013 will establish. If TASK-013 is not yet done,
  keep `es2018` as a safe minimum for Node 10+.
- [ ] Update the root `jest.config.js` `ts-jest` transform to reference the
      new base config name if needed (check current `globals` setting).
- [ ] Run `npm test` — must pass with no changes to test output.
- [ ] Commit: `chore(monorepo): add tsconfig.base.json for TS migration`

## Notes

- No `paths` entries are needed in the base config. Lerna symlinks all
  packages into `node_modules` so cross-package imports resolve via the
  standard Node module resolution algorithm.
- The `"include": []` is intentional — the base config compiles nothing
  directly. Each package's `tsconfig.json` provides its own `include`.
- Per-package tsconfig template (each converted package adds this):
  ```json
  // packages/<name>/tsconfig.json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "outDir": "./dist",
      "rootDir": "./src"
    },
    "include": ["src/**/*.ts"]
  }
  // packages/<name>/tsconfig.build.json (for tsc emit, excludes tests)
  {
    "extends": "./tsconfig.json",
    "exclude": ["**/__tests__/**", "**/__mocks__/**"]
  }
  ```
- Per-package jest config addition (wherever ts-jest is active):
  ```js
  globals: { 'ts-jest': { tsconfig: './tsconfig.json' } }
  ```
- See TASK-002 for full migration strategy.
