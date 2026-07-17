# TASK-008: Set up shared TypeScript infrastructure

**Status:** complete
**Feature:** Migrate JS→TS
**Scope:** monorepo
**Priority:** high
**GitHub Issue:** #493 — https://github.com/triplecanopy/b-ber/issues/493

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

- [x] `git checkout -b feat/ts-stage-1`
- [x] Install dev dependencies at the monorepo root:

  ```bash
  npm install --save-dev tsdown @swc/core @swc/jest typescript@^5.9.3 --legacy-peer-deps
  ```

  TypeScript upgraded from ^4.0.5 to ^5.9.3 — required because tsdown only supports
  TypeScript ≥5. `--legacy-peer-deps` needed due to ts-jest@26 and
  @typescript-eslint@4 peer dep constraints (both will be removed/upgraded later).

- [x] Create root `tsconfig.base.json` (shared compiler options for all packages):

  - `"composite": true` included so packages can participate in project references
  - `"forceConsistentCasingInFileNames": true` carried forward from the old root tsconfig
  - No `include` — each package tsconfig provides its own

- [x] Replace the verbose root `tsconfig.json` with a clean solution-style tsconfig:

  ```json
  { "references": [] }
  ```

  This is the standard TypeScript project-references coordination pattern. As packages
  are converted, their tsconfig paths are added to `references`. The old tsconfig.json
  had stale commented-out boilerplate from the original repo scaffolding.

- [x] Create root `.swcrc` (used by `@swc/jest`):
      TypeScript + decorators support, targeting es2020, outputting commonjs.

- [x] Add a root-level type-check script to `package.json`:
  ```json
  "typecheck": "lerna run typecheck"
  ```
  Note: `tsc --noEmit --project tsconfig.base.json` was the original plan but
  TypeScript errors on "no inputs found" when `include` is empty, even in
  `--build` mode. The correct approach is `lerna run typecheck` — it silently
  no-ops when no packages have a `typecheck` script and runs per-package
  `tsc --noEmit` as they are converted. Each converted package adds its own
  `"typecheck": "tsc --noEmit"` script.

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

Update `package.json` build and typecheck scripts:

```json
"build": "tsdown",
"typecheck": "tsc --noEmit"
```

Also add the package tsconfig path to the root `tsconfig.json` `references` array:

```json
{ "path": "packages/<name>" }
```

### Validation

- [x] Run `npm test` from repo root — no regressions; 46 suites pass (38 pre-existing
      bootstrap failures require `lerna bootstrap --hoist` and are unchanged)
- [x] Run `npm run typecheck` — exits 0 (no packages converted yet; `lerna run typecheck`
      silently no-ops)
- [x] Commit: `chore(monorepo): add tsconfig.base.json, tsdown, and swc for TS migration`

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
