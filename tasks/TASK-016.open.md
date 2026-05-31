# TASK-016: Detect and resolve circular imports and structural dependency risks

**Status:** not started
**Scope:** monorepo
**Priority:** medium

## Description

Audit the monorepo for circular imports and other structural dependency
problems before the TypeScript migration begins. Circular imports silently
corrupt module state in Node.js (one side of the cycle gets an empty object
at import time) and become compile errors under strict TypeScript project
references. Better to find them in JS than discover them mid-migration.

A secondary goal is to catalog other structural risks that will complicate
TASK-008+ if left unaddressed.

## Subtasks

### Circular import detection

- [ ] Add `madge` (or `dpdm`) as a dev dependency at the monorepo root
- [ ] Run `madge --circular --extensions js packages/` and capture output
- [ ] For each cycle found: determine if it is a real runtime cycle or a
      type-only import (safe to break with a re-export file)
- [ ] Break real cycles by extracting the shared value into a third module
      that neither side imports from the other
- [ ] Re-run madge; confirm zero cycles before closing task

### Known structural risks to address

- [ ] **Mixed module systems**: several packages use `module.exports` (CJS)
      while others use ES module `export default`. Document which packages
      are CJS-only and flag them as needing `module.exports → export default`
      conversion before TS migration (TS project references require consistent
      module format).
      Packages confirmed CJS: `b-ber-parser-footnotes` (src/index.js),
      `b-ber-parser-dialogue`. Check the rest of the parser-\* group.

- [ ] **Implicit/undeclared internal dependencies**: grammar packages do not
      declare `b-ber-lib` as a direct dependency but their code (and test
      mocks) requires it. This means they silently rely on `b-ber-grammar-renderer`
      or another dep hoisting `b-ber-lib` into their `node_modules`. Enumerate
      all such implicit deps and add explicit `dependencies` entries.
      (Discovered during TASK-004: had to add `moduleNameMapper` to every
      grammar/parser jest.config.js to work around this.)

- [ ] **Global singleton State object**: `b-ber-lib/State` is a mutable
      singleton imported and mutated by virtually every package. This is the
      single largest obstacle to isolated unit testing and to parallelising
      build steps. Not a blocker for TS migration, but document the coupling
      surface so it is not made worse by the migration. Consider whether a
      context-injection pattern is feasible at the TASK-013 (Node.js
      modernization) stage.

- [ ] **`process.exit(1)` in b-ber-logger**: `log.error` calls
      `process.exit(1)` unconditionally. Library code must not call
      `process.exit`; it kills test runners and makes the logger
      non-composable. Fix: remove the exit from the library; let the
      CLI caller (`b-ber-cli`) handle the exit after catching a thrown
      error. This is a correctness fix, not just a test-hygiene fix.
      Track separately or fold into TASK-011 (logger TS conversion).

- [ ] **Stale / suspicious dependencies**: the following deserve a pass
      before the TS migration adds type declarations for them: - `tar` appears in `b-ber-grammar-renderer` dependencies — a grammar
      package should not need `tar`; likely a leftover from an old merge - `lodash` + `lodash.isundefined` coexist in several grammar packages;
      individual lodash method packages are deprecated — consolidate to
      `lodash` imports - Root `package.json` declares `babel-cli: ^6.26.0` (Babel 6) as a
      dev dependency alongside Babel 7. Remove the Babel 6 remnant. - `layouts` is used by `b-ber-lib` and `b-ber-tasks`; verify it is
      still maintained and document what it does

- [ ] **`b-ber-reader` as a runtime dep of `b-ber-tasks`**: the build pipeline
      depends on the legacy reader package at runtime. Confirm this is
      intentional (needed for the `reader` build task) and document it in
      b-ber-tasks/AGENTS.md so it is not accidentally dropped.

## Notes

- Run madge from the repo root; it understands Lerna symlinks in `node_modules`
- Recommended madge command: `npx madge --circular --extensions js,jsx --webpack-config <path> packages/`
- If the monorepo's Lerna symlinks confuse madge, run per-package:
  `cd packages/<name> && npx madge --circular src/`
- `dpdm` is an alternative that handles CJS/ESM mixed mode better
- The `process.exit` in logger is tracked in memory as a known testing issue;
  this task formalizes fixing it properly rather than just mocking around it
- The implicit-dependency problem will re-surface during TypeScript migration
  when `tsc --build` fails to find type declarations for undeclared deps
