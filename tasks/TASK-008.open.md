# TASK-008: Set up shared TypeScript infrastructure

**Status:** not started
**Scope:** monorepo
**Priority:** high

## Description

Establish the shared TypeScript configuration and build toolchain that all
per-package migrations will use. This is a prerequisite for every task in
the TASK-002 Stage 1–3 migration sequence.

### Toolchain approach

The monorepo currently uses Babel for all transpilation. Rather than layering
`@babel/preset-typescript` on top, this task replaces the Babel build step
with a purpose-built TypeScript toolchain:

| Concern                       | Current                          | After this task                                |
| ----------------------------- | -------------------------------- | ---------------------------------------------- |
| Transpilation (Node packages) | `babel-jest` + `babel.config.js` | **tsdown** (wraps rolldown)                    |
| Test transform                | `babel-jest`                     | **`@swc/jest`** (drop-in replacement)          |
| Type checking                 | (none)                           | **`tsc --noEmit`** (root `tsconfig.base.json`) |
| Transpilation (reader-react)  | Babel + webpack                  | Vite/esbuild — handled separately in TASK-006  |

**Why tsdown over `tsc` for emit?**
`tsc` type-checks AND emits — correct but slow. tsdown (the rolldown-based
successor to tsup) provides sub-second transpilation and handles `.d.ts`
generation via `tsc --emitDeclarationOnly`. The build pipeline stays fast;
type correctness is enforced by the separate `tsc --noEmit` step.

tsup has been deprecated in favour of rolldown; tsdown is the official
migration path.

**Why `@swc/jest` over `babel-jest`?**
SWC is written in Rust — 10–20× faster than Babel for test transforms. It
is a drop-in replacement: swap the `transform` entry in each `jest.config.js`
from `jest-transform-upward.js` (Babel) to `@swc/jest`. No other test config
changes required.

Babel can be removed from the monorepo entirely once all packages are
converted.

## Branch

`feat/ts-stage-1`. All Stage 1 conversion tasks (TASK-009 through TASK-012)
work on this branch. Each package conversion is one commit. Merge to
`feat/upgrades` once the full stage is complete and all tests pass.

## Subtasks

### Toolchain setup

- [ ] `git checkout -b feat/ts-stage-1`
- [ ] Install dev dependencies at the monorepo root:
  ```bash
  npm install --save-dev tsdown @swc/core @swc/jest typescript
  ```
- [ ] Create root `tsconfig.base.json`:

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

  `"include": []` is intentional — the base config compiles nothing directly.
  Each package's `tsconfig.json` provides its own `include`.

  `target: es2020` matches the Node ≥ 20 engine target that TASK-013 will
  establish. Use `es2018` if TASK-013 has not landed yet.

- [ ] Create root `.swcrc` (used by `@swc/jest`):

  ```json
  {
    "jsc": {
      "parser": { "syntax": "typescript", "decorators": true },
      "target": "es2020",
      "transform": {
        "legacyDecorator": true,
        "decoratorMetadata": true
      }
    },
    "module": { "type": "commonjs" }
  }
  ```

- [ ] Add a root-level type-check script to `package.json`:
  ```json
  "typecheck": "tsc --noEmit --project tsconfig.base.json"
  ```

### Per-package template

When a package is converted (TASK-009+), add these files:

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
```

```json
// packages/<name>/tsconfig.build.json (used by tsdown — excludes tests)
{
  "extends": "./tsconfig.json",
  "exclude": ["**/__tests__/**", "**/__mocks__/**"]
}
```

```js
// packages/<name>/tsdown.config.ts (or tsdown.config.js)
import { defineConfig } from 'tsdown'
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'], // add 'esm' when the package is ready
  dts: true, // generate .d.ts via tsc --emitDeclarationOnly
  clean: true,
  tsconfig: './tsconfig.build.json',
})
```

Update `jest.config.js` in the converted package:

```js
// Replace jest-transform-upward.js (babel-jest) with @swc/jest
transform: { '^.+\\.[jt]sx?$': '@swc/jest' },
```

Update `package.json` build script:

```json
"build": "tsdown",
"typecheck": "tsc --noEmit"
```

### Validation

- [ ] Run `npm test` from repo root — must pass with no regressions
- [ ] Run `npm run typecheck` — confirm it invokes `tsc --noEmit` cleanly
      (zero errors expected before any packages are converted to TS)
- [ ] Commit: `chore(monorepo): add tsconfig.base.json, tsdown, and swc for TS migration`

## Notes

- No `paths` entries are needed in the base tsconfig. Lerna symlinks all
  packages into `node_modules` so cross-package imports resolve via the
  standard Node module resolution algorithm.
- Babel is not removed in this task — it stays until all packages are
  converted. Remove it in a cleanup commit after TASK-012.
- `@swc/jest` and `babel-jest` can coexist during migration: packages that
  have been converted use `@swc/jest`; unconverted packages keep the existing
  `jest-transform-upward.js` transform.
- See TASK-002 for full migration strategy and package ordering.
- See `docs/diagrams/` for architecture diagrams showing how packages relate.
