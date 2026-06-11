# TASK-002: Plan JS → TS migration strategy

**Status:** complete
**Feature:** Migrate JS→TS
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #457 — https://github.com/triplecanopy/b-ber/issues/457

## Description

The monorepo is currently pure JavaScript. Migrating to TypeScript will
improve type safety, enable better IDE tooling, and reduce categories of
runtime errors — especially important before any large-scale refactoring.
This task produces a migration strategy document before any code is touched.

The strategy must account for the planned webpack replacement (TASK-001).
Migrating the build system and the language at the same time is high-risk;
the sequencing decision is the most important output of this task.

## Subtasks

- [x] Audit current build tooling in each package to understand how TypeScript
      would interact with it.
- [x] Decide sequencing relative to TASK-001 (webpack replacement).
- [x] Define migration stages and order.
- [x] Identify shared TypeScript config requirements.
- [x] Determine type-checking strategy during incremental migration.
- [x] Decide on `strict` mode rollout.
- [x] Write migration plan (see Research Findings below).
- [x] Open per-package implementation tasks: TASK-008 (infra), TASK-009 (shapes-directives),
      TASK-010 (shapes-dublin-core, shapes-sequences), TASK-011 (logger), TASK-012 (lib).

## Research Findings

### Build Tooling Audit

**Packages with webpack:**

- `b-ber-reader-react` — main reader; build via shell scripts calling webpack.
  No per-package tsconfig. Uses a `jest-transform-upward.js` shim so tests pick
  up the root Babel config.
- `b-ber-reader` — legacy deployment shell; its own `webpack.config.js` and
  `.babelrc` (`@babel/preset-env` + `@babel/preset-react`). Production-only build.

**Node-only packages (30+):**
All compile via the root `babel.config.js`. The root config bifurcates via
`overrides`: `b-ber-reader` path gets browser targets + `@babel/preset-react`;
all others get the Node-targeted config. No webpack involved for these packages.

**Current TypeScript presence:**

- `b-ber-validator` is the only fully TypeScript package. Uses `tsc` directly
  (not Babel) with its own `tsconfig.json` + `tsconfig.build.json`, `ts-jest`
  in tests, `@typescript-eslint`. Does not use root `babel.config.js`.
  **This is the proven pattern for Node-only packages.**
- Root `tsconfig.json` exists with `strict: true`, `module: commonjs`,
  `target: es6`, `esModuleInterop: true`, but has no `include` glob —
  it is a skeleton, not actively used.
- Root `jest.config.js` already has both transforms (`ts-jest` for `.tsx?`,
  `babel-jest` for `.jsx?`) — incremental TS adoption in Node packages is
  already supported at the test level without any jest config changes.

### Sequencing Decision: Option A — Node packages first, reader-react after TASK-001

TypeScript adoption splits cleanly along the **Node/browser line**. The 30+
Node-only packages (lib, logger, tasks, parsers, grammars, shapes, cli,
templates) use `tsc` directly and are **completely independent of the bundler**.
`b-ber-reader-react` is the one package where the bundler and TypeScript
toolchain are coupled.

**Start Node-only TS migration independently of TASK-001.** Do not touch
`b-ber-reader-react` until TASK-001 concludes. Once the new bundler (Vite,
per TASK-001 findings) is in place, TypeScript support is first-class and
free. Attempting TS in `b-ber-reader-react` while still on webpack would
add `ts-loader` or `babel-preset-typescript` complexity that is thrown away
when the bundler changes.

### Migration Stages

**Stage 1 — shapes and infrastructure (now, no bundler dependency):**

1. `b-ber-shapes-directives` — 16 dependents; convert first (see TASK-003)
2. `b-ber-shapes-dublin-core`, `b-ber-shapes-sequences`
3. `b-ber-logger` — single-purpose, minimal surface
4. `b-ber-lib` — converts early so types propagate to all consumers

**Stage 2 — mid-layer packages (after Stage 1 types are available):**

5. `b-ber-markdown-renderer`, `b-ber-templates`
6. Parser packages (`b-ber-parser-*`) — each is narrow in scope; 5 packages
7. Grammar packages (`b-ber-grammar-*`) — 16 packages; convert in parallel
   since they are independent of each other. Audit `@types/*` for remark/rehype
   plugins before starting this wave.

**Stage 3 — pipeline entry points (after grammar/parser types propagate):**

8. `b-ber-tasks`, `b-ber-cli` — depend on nearly everything above; converting
   last means types flow in from all dependencies

**Stage 4 — browser package (after TASK-001 bundler decision):**

9. `b-ber-reader-react` — largest package, most complex tooling, JSX, most tests;
   defer until bundler is settled. Update jest transform to include `tsx?`.

**`b-ber-reader` (legacy):** Leave as JavaScript indefinitely — it is a thin
deployment shell with no logic and no open tasks.

### Shared tsconfig Infrastructure

Rename the root `tsconfig.json` to `tsconfig.base.json` and make it a proper base:

- Keep: `strict: true`, `module: commonjs`, `target: es6`, `esModuleInterop: true`,
  `skipLibCheck: true`
- Add: `declaration: true`, `declarationMap: true`, `sourceMap: true`
- Change: `"include": []` to prevent it from compiling anything directly

Each migrated package gets:

```json
// tsconfig.json
{ "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*.ts"] }

// tsconfig.build.json (excludes test/mock files from emit)
{ "extends": "./tsconfig.json",
  "exclude": ["**/__tests__/**", "**/__mocks__/**"] }
```

No `paths` references needed — Lerna symlinks packages into `node_modules`
so `@canopycanopycanopy/b-ber-shapes-directives` resolves via normal Node
resolution through the symlink.

Per-package jest configs should set:

```js
globals: { 'ts-jest': { tsconfig: './tsconfig.json' } }
```

(same pattern the validator uses).

### Type-checking Strategy During Migration

- **Skip `checkJs: true` / JSDoc.** The validator proves `tsc` + rename-to-`.ts`
  is viable. JSDoc typing in JS is a dead-end.
- **Skip `allowJs: true`.** Packages are converted as a unit, not file by file.
  Unconverted packages import from converted ones via their `dist/` CJS output
  typed via `.d.ts` files — no mixed-source issue.
- **`noImplicitAny`: enforce from day one** on each package as it is converted.
  Use explicit `any` casts with `// TODO: type this` comments for hard cases.
- **`strict` mode: inherit from base at conversion time.** Do not downgrade.

### Risks and Blockers

1. **Shapes packages are Babel-compiled.** The `src/` is clean ES modules but
   the published `index.js` is Babel CJS output. Switching to `tsc` changes the
   output format. Test that `tsc --outDir dist` + updating `"main": "dist/index.js"`
   works for all 16 consumers of `b-ber-shapes-directives` before completing Stage 1.
2. **`b-ber-lib` exports are used by almost everything.** A type error in `lib`
   blocks many downstream packages. Budget extra time and do it before the
   grammar/parser wave.
3. **Grammar packages (16) depend on remark/rehype plugin API.** Audit
   `@types/*` availability for those plugins before starting Stage 2.
4. **`b-ber-reader-react` jest transform** uses a custom `babel-jest` shim.
   When its turn comes, add `ts-jest` for `.tsx?` and update `testMatch` to
   include `tsx?`. Do not do this until after TASK-001 resolves.

## Notes

- This is a planning task only. No source files should be changed here.
- TASK-001 has concluded: recommendation is **Vite** (see TASK-001 findings).
  This confirms Option A — do Node-only TS migration now; defer reader-react
  until the Vite migration is complete.
- See TASK-003 for type consolidation findings; `b-ber-shapes-directives` should
  be the first package converted (Stage 1, step 1).
