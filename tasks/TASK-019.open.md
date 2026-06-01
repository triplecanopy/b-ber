# TASK-019: TypeScript migration — full monorepo conversion

**Status:** not started
**Scope:** monorepo
**Priority:** high
**GitHub Issue:** #479 — https://github.com/triplecanopy/b-ber/issues/479

## Description

Convert the entire b-ber monorepo from JavaScript to TypeScript. The migration
runs in four stages ordered by dependency depth: shared shapes and core
libraries first, mid-layer parsers/grammars/templates second, pipeline entry
points third, and the browser package last. Each stage runs on its own feature
branch and merges to `feat/upgrades` when complete.

This is the canonical tracking document for the entire migration. Individual
tasks (TASK-008 through TASK-012, and future stage tasks) are the unit of
execution; this task holds the overall strategy, stage status, branching plan,
toolchain spec, and architecture decisions.

## Sub-tasks

### Pre-migration cleanup (on `feat/upgrades` before any TS branch)

These are blockers identified in TASK-016. All are small, low-risk changes:

- [x] Remove `tar` from `b-ber-grammar-renderer/package.json` (never imported).
      Also removed from all other grammar/parser packages where it was unused:
      grammar-section, grammar-pullquote, grammar-attributes, grammar-vimeo,
      grammar-image, grammar-audio-video, parser-footnotes, parser-figure, b-ber-logger.
- [x] Remove `babel-cli@^6.26.0` from root `package.json` devDependencies
- [x] Convert `b-ber-parser-footnotes/src/index.js` from `module.exports` to
      `export default` — the only first-party CJS entry point; TS project
      references require consistent module format across the dependency graph
- [x] Consolidate `lodash.has` / `lodash.isundefined` per-method packages to
      `import x from 'lodash/x'` subpath imports across grammar/parser packages.
      Also consolidated `lodash.find`, `lodash.uniq`, `lodash.isplainobject`.
      Removed all per-method devDependencies from affected package.json files.

### Stage 1 — shapes + core libraries (`feat/ts-stage-1`)

- [ ] **TASK-008** — Set up shared TypeScript infrastructure (tsdown, @swc/jest,
      tsconfig.base.json, root typecheck script). Gate for all subsequent tasks.
- [ ] **TASK-009** — Convert `b-ber-shapes-directives`. First package because
      it has 16 consumers; also deletes the hand-written ambient stub in
      `b-ber-validator` once the real `.d.ts` exists.
- [ ] **TASK-010** — Convert `b-ber-shapes-dublin-core` and
      `b-ber-shapes-sequences`. Independent of each other; follow TASK-009.
- [ ] **TASK-011** — Convert `b-ber-logger`. Independent of TASK-010; can run
      in parallel on the same branch.
- [ ] **TASK-012** — Convert `b-ber-lib`. Depends on TASK-009–011 having
      emitted `.d.ts` files first. Largest Stage 1 conversion.
- [ ] Merge `feat/ts-stage-1` → `feat/upgrades`
- [ ] Cleanup commit: remove `babel.config.js` and all `@babel/*` packages from
      root now that all Stage 1 packages use tsdown + @swc/jest.

### Stage 2 — mid-layer packages (`feat/ts-stage-2`)

No individual tasks exist yet. Open them before starting this stage.

- [ ] Open tasks for: `b-ber-templates`, `b-ber-markdown-renderer`
- [ ] Open tasks for: all 5 `b-ber-parser-*` packages
- [ ] Open tasks for: all 16 `b-ber-grammar-*` packages
- [ ] Pre-work: audit `@types/*` availability for remark/rehype plugin API
      (grammar packages depend on it) before starting the grammar wave
- [ ] Merge `feat/ts-stage-2` → `feat/upgrades`

### Stage 3 — pipeline entry points (`feat/ts-stage-3`)

- [ ] Open tasks for: `b-ber-tasks`, `b-ber-cli`
- [ ] Merge `feat/ts-stage-3` → `feat/upgrades`

### Stage 4 — browser package (after TASK-020 Vite migration lands)

- [ ] Open task for: `b-ber-reader-react`
- [ ] **Blocked on TASK-020** (Vite migration). Do not start until Vite is in
      place — the bundler and TS toolchain are coupled in this package.
- [ ] Merge to `feat/upgrades`

### Not migrated

- `b-ber-reader` — legacy thin deployment shell, no open tasks, leave as JS.

## Toolchain

| Concern               | Before       | After                                                                |
| --------------------- | ------------ | -------------------------------------------------------------------- |
| Build (Node packages) | `babel`      | **tsdown** (rolldown-based; `.d.ts` via `tsc --emitDeclarationOnly`) |
| Test transform        | `babel-jest` | **`@swc/jest`** (drop-in, ~15× faster, Rust-based)                   |
| Type checking         | nothing      | **`tsc --noEmit`** (`npm run typecheck` from root)                   |
| Build (reader-react)  | webpack      | Vite/esbuild — TASK-020, entirely separate                           |

`@swc/jest` and `babel-jest` coexist during migration: converted packages use
`@swc/jest`; unconverted packages keep the existing transform. Babel is removed
in a single cleanup commit after Stage 1 completes.

## Per-package pattern

Every converted package gets these files (templates defined in TASK-008):

```
packages/<name>/
  tsconfig.json           extends ../../tsconfig.base.json
  tsconfig.build.json     extends ./tsconfig.json, excludes __tests__/__mocks__
  tsdown.config.ts        entry: src/index.ts, format: cjs, dts: true
  jest.config.js          transform: { '^.+\\.[jt]sx?$': '@swc/jest' }
  package.json            "build": "tsdown", "typecheck": "tsc --noEmit"
                          "main": "dist/index.js", "types": "dist/index.d.ts"
```

## Branching

```
feat/upgrades
  ├── feat/ts-stage-1   TASK-008 + TASK-009 + TASK-010 + TASK-011 + TASK-012
  ├── feat/ts-stage-2   Stage 2 tasks (to be opened)
  ├── feat/ts-stage-3   Stage 3 tasks (to be opened)
  └── (stage-4 on same branch as TASK-020 reader-react Vite work, TBD)
```

Each stage branch merges to `feat/upgrades` only when all packages in that
stage have been converted and `npm test` passes cleanly from the root.

## Package dependency topology (TS project reference order)

Derived from TASK-016 package dependency map. Lower layers must emit `.d.ts`
before upper layers are converted:

```
Layer 0 (leaves):
  b-ber-shapes-directives, b-ber-shapes-dublin-core, b-ber-shapes-sequences
  b-ber-logger
  b-ber-theme-serif, b-ber-theme-sans

Layer 1:
  b-ber-lib            → shapes-*, logger, themes
  b-ber-validator      → shapes-directives

Layer 2:
  b-ber-templates      → lib, logger
  b-ber-parser-*       → lib, logger, shapes-directives, templates

Layer 3:
  b-ber-grammar-*      → grammar-attributes, lib, logger, parser-*, shapes-directives

Layer 4:
  b-ber-markdown-renderer → all grammars, parser-footnotes, parser-gallery

Layer 5:
  b-ber-tasks          → lib, logger, markdown-renderer, templates, shapes-sequences, ...

Layer 6:
  b-ber-cli            → lib, logger, shapes-sequences, tasks, templates

Layer 7 (browser):
  b-ber-reader-react
```

## Sequencing rationale

- **Node packages first, reader-react last.** The 30+ Node-only packages use
  `tsc` directly and are completely independent of the bundler. `b-ber-reader-react`
  is the one package where the bundler and TS toolchain are coupled (JSX, CSS
  modules, test transform). Doing it first would add `ts-loader` complexity only
  to discard it when Vite lands.
- **No `allowJs` or JSDoc typing.** Packages are converted as a unit. Unconverted
  packages import from converted ones via their `dist/` CJS output typed via
  `.d.ts` — no mixed-source issues.
- **`strict` mode from day one** on each package as it converts. Use explicit
  `any` with `// TODO: type this` for hard cases; do not downgrade strict settings.

## Related tasks

| Task     | Role                                                                                    |
| -------- | --------------------------------------------------------------------------------------- |
| TASK-002 | Original migration strategy research (complete, closed)                                 |
| TASK-003 | Type consolidation research — established shapes-directives priority (complete, closed) |
| TASK-016 | Circular import audit — identified pre-migration cleanup items (complete, closed)       |
| TASK-008 | Stage 1: infra setup                                                                    |
| TASK-009 | Stage 1: b-ber-shapes-directives                                                        |
| TASK-010 | Stage 1: b-ber-shapes-dublin-core + b-ber-shapes-sequences                              |
| TASK-011 | Stage 1: b-ber-logger                                                                   |
| TASK-012 | Stage 1: b-ber-lib                                                                      |
| TASK-020 | Vite + Biome migration — Stage 4 (reader-react) is blocked on this                      |
| TASK-013 | Node.js modernization — runs after Stage 1–3 complete                                   |

## Notes

- This task is the single source of truth for migration status. Update the
  sub-task checkboxes here as individual tasks complete, in addition to closing
  the individual task files.
- Architecture diagrams can be added to `docs/diagrams/` and linked here.
- If requirements shift (e.g., a new package is added, a stage is reordered),
  update this file. Do not edit closed sub-task files — open a new task instead.
