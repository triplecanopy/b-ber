# TASK-013: Node.js modernization

**Status:** not started
**Scope:** monorepo
**Priority:** medium

## Description

The monorepo was written before async/await was idiomatic Node.js. The engine
requirement (`>= 10.x`) is ancient — Node 10 reached end-of-life in 2021.
This task audits the codebase, raises the engine floor to a supported LTS
release, and opens per-package tasks for modernization work. Node.js 22 is the
current LTS (as of mid-2025); Node.js 20 is the prior LTS (supported until
April 2026). Target: `>= 22.x`.

This work should run **after** the TypeScript migration (TASK-002 Stage 1–3)
so that the codebase being modernized is already typed. Typed code is much
easier to refactor safely.

## Subtasks

- [ ] Update root `package.json` `engines.node` from `>= 10.x` to `>= 22.x`.
      Verify CI (if any) and local tooling can run this version.
- [ ] Audit each package for modernization opportunities. For each, open a
      package-level task (`packages/<name>/tasks/TASK-NNN.open.md`) with a
      specific list of changes needed. Categories to audit:

  **1. Bare Node.js built-in imports**
  Replace `'fs'`, `'path'`, `'os'`, `'stream'`, `'child_process'`, etc.
  with the `node:` prefix form (`'node:fs'`, `'node:path'`, etc.).
  The `node:` prefix is required style for ESM and recommended for all code
  on Node ≥ 14.18. Current offenders: `b-ber-reader/server.js`,
  `b-ber-theme-serif/index.js` (and likely others in tasks/lib).

  **2. Promise chains → async/await**
  `.then().catch()` chains should become `async function` + `try/catch`.
  Primary targets: `b-ber-tasks/src/` (most pipeline steps use promise chains),
  `b-ber-lib/src/` (utility helpers).
  Do not convert code that feeds into stream pipelines or event emitters — only
  self-contained promise chains.

  **3. `fs-extra` → `node:fs/promises`**
  `fs-extra` adds promisified wrappers (`ensureDir`, `copy`, `remove`, `mkdirp`)
  that are now available natively or via `node:fs/promises` + `node:path`.
  Evaluate on a per-package basis: where the only `fs-extra` calls are standard
  `fs/promises` equivalents, replace and remove the dependency. Do not replace
  `fs-extra.copy` with a naive `fs.cp` without checking behavior parity.

  **4. `lodash` usage**
  Many lodash helpers (`isArray`, `isString`, `isObject`, `merge`, `get`, `set`,
  `cloneDeep`, `pick`, `omit`) have native equivalents in modern JavaScript.
  Audit per-package; replace where the native equivalent is a one-liner with
  identical semantics. Do not replace complex lodash compositions wholesale —
  prioritize the most common single-function calls.

  **5. Class-based patterns → functions where appropriate**
  Several `b-ber-tasks/src/` modules use classes as namespaces (a single
  instantiation pattern with no inheritance). Where a module is a class with
  one static method per task step, a module of plain `async function` exports
  is simpler. Do not convert classes that have real state or inheritance.

  **6. CommonJS `require()` calls**
  The build pipeline uses Babel-compiled CommonJS output. After the TS migration
  switches packages to `tsc` with `"module": "commonjs"`, any remaining
  `require()` calls in source should be converted to `import` statements.

- [ ] Priority order for per-package audits:

  1. `b-ber-tasks` — largest surface area, most promise chains
  2. `b-ber-lib` — shared utilities, affects everything downstream
  3. `b-ber-cli` — entry point, affects developer UX
  4. Grammar and parser packages — smaller, more uniform, easier to batch
  5. `b-ber-reader` / `b-ber-reader-react` — after Vite migration (TASK-006/007)

- [ ] Once per-package tasks are open, track completion here.

## Notes

- **Sequencing:** Run this after the TS migration for each package, not before.
  The TypeScript compiler will surface type errors during the async/await
  refactor that would otherwise be silent.
- **Reversibility:** Each `node:` prefix change is a one-line diff and trivially
  reversible. Each async/await conversion is a self-contained function rewrite —
  keep commits to one function or one file at a time.
- **Feature branches:** Use `feat/node-modernization-<package>` per package
  batch (e.g., `feat/node-modernization-tasks` for all `b-ber-tasks` work).
  These branches are small and fast to review.
- **`fs-extra`:** Do not remove it until you have verified behavior parity for
  each replaced call. `fs.cp` (Node ≥ 16) is not identical to `fs-extra.copy`
  (especially for edge cases with symlinks and file permissions).
- **Engine version selection:** Node 22 is LTS-current. Node 24 is the current
  active release (as of 2026). Targeting `>= 22.x` keeps a two-year support
  window and enables all modern APIs (structuredClone, `Array.at`, `Object.hasOwn`,
  `using`, top-level await in ESM, etc.).
