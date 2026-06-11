# TASK-016: Detect and resolve circular imports and structural dependency risks

**Status:** complete
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #498 — https://github.com/triplecanopy/b-ber/issues/498

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

- [x] Add `madge` as a dev dependency at the monorepo root (`madge@8.0.0`)
- [x] Run `madge --circular --extensions js,jsx packages/` and capture output
- [x] For each cycle found: determine if it is a real runtime cycle
- [x] Break real cycles by importing directly instead of through barrel files
- [x] Re-run madge; confirm zero cycles before closing task
- [x] Add `npm run check:circular` script to root `package.json`

### Known structural risks to address

- [x] **Mixed module systems**: documented below
- [x] **Implicit/undeclared internal dependencies**: confirmed all grammar packages that use `b-ber-lib` do declare it as a direct dependency; the `moduleNameMapper` workaround in jest configs is a test-tooling requirement, not a missing declaration
- [x] **Global singleton State object**: documented below
- [x] **`process.exit(1)` in b-ber-logger**: documented, tracked in TASK-011
- [x] **Stale / suspicious dependencies**: audited — findings below
- [x] **`b-ber-reader` as a runtime dep of `b-ber-tasks`**: confirmed intentional; `src/reader/index.js` copies the b-ber-reader bundle into the reader build output

## Circular Import Findings

madge found **9 circular dependencies** (5 unique in `src/`; 4 were compiled dist mirrors).

### Cycle set 1 — b-ber-lib barrel import in utils/index.js

```
b-ber-lib/src/utils/index.js → b-ber-lib/src/index.js (barrel)
b-ber-lib/src/Theme.js → b-ber-lib/src/utils/index.js → b-ber-lib/src/index.js
```

**Root cause:** `utils/index.js` imported `{ Url, State }` from `'..'` (the barrel) instead of directly from `'../Url'` and `'../State'`.

**Fix:** `packages/b-ber-lib/src/utils/index.js` — replaced barrel import with two direct imports.

### Cycle set 2 — b-ber-tasks opf barrel

```
b-ber-tasks/src/opf/index.js → b-ber-tasks/src/opf/Opf.js → b-ber-tasks/src/opf/index.js
```

**Root cause:** `Opf.js` imported `{ ManifestAndMetadata, Navigation }` from `'.'` (the opf barrel), but `opf/index.js` re-exports `Opf`.

**Fix:** `packages/b-ber-tasks/src/opf/Opf.js` — replaced barrel import with direct sibling imports.

### Cycle set 3 — b-ber-tasks main barrel (serialize + serve)

```
b-ber-tasks/src/index.js → b-ber-tasks/src/serialize.js → b-ber-tasks/src/index.js
b-ber-tasks/src/index.js → b-ber-tasks/src/serve/index.js → b-ber-tasks/src/index.js
```

**Root cause:** `serialize.js` did `import * as tasks from '..'` (needs dynamic task lookup by string name). `serve/index.js` did `import { serialize } from '..'`. Both created back-references to the main barrel that exports them.

**Fix:**

- Created `packages/b-ber-tasks/src/task-handlers.js` — a dedicated barrel of all runnable build tasks (excludes `serialize` and `serve` themselves to break the cycle)
- `serialize.js` now imports from `'./task-handlers'` instead of `'..'`
- `serve/index.js` now imports `serialize` from `'../serialize'` instead of `'..'`

### After fixes

Running `npm run check:circular` from the repo root reports zero circular dependencies across all 1022 files (src + dist).

## Structural Risk Catalogue

### 1. Mixed CJS/ESM (blocker for TypeScript project references)

Packages using `module.exports` (CommonJS) in their main source:

| Package                  | File           | Notes                                                               |
| ------------------------ | -------------- | ------------------------------------------------------------------- |
| `b-ber-parser-footnotes` | `src/index.js` | markdown-it plugin; uses `module.exports = function footnotePlugin` |

All other packages use ES module syntax. Vendored code in `b-ber-markdown-renderer/src/highlightjs/` uses CJS but is third-party and should be excluded from TS conversion. `b-ber-templates/src/Project/*.js` files use CJS but are template-string generators, not imported by any build-critical path.

**Action required before TASK-009+**: Convert `b-ber-parser-footnotes/src/index.js` to `export default function footnotePlugin`.

### 2. Deprecated per-method lodash packages

Ten packages declare individual lodash method packages as direct dependencies instead of importing from the `lodash` umbrella package:

| Deprecated dep       | Packages that declare it                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `lodash.has`         | grammar-attributes, grammar-audio-video, grammar-pullquote                                                         |
| `lodash.isundefined` | grammar-iframe, grammar-pullquote, grammar-image, grammar-vimeo, grammar-renderer, parser-figure, parser-footnotes |

These packages coexist with `lodash` imports elsewhere. The per-method packages are unmaintained; consolidate all to `import has from 'lodash/has'` (treeshakeable subpath imports) before the TS migration adds type declarations.

### 3. Stale dependencies

| Package                  | Dep                 | Verdict                                                                                                        |
| ------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------- |
| `b-ber-grammar-renderer` | `tar@^6.1.11`       | **Remove** — never imported in `src/`, almost certainly a merge remnant                                        |
| root `package.json`      | `babel-cli@^6.26.0` | **Remove** — Babel 6 devDep, Babel 7 handles all transpilation; confirmed no script calls `babel-cli` directly |

### 4. `layouts` package

Used in `b-ber-lib/src/Template.js` and `b-ber-tasks/src/opf/Opf.js` (via renderLayouts). Wraps XHTML body content in full EPUB page templates using Handlebars. Still maintained at 3.0.2. No action required.

### 5. `b-ber-reader` as b-ber-tasks runtime dependency

Confirmed intentional. `b-ber-tasks/src/reader/index.js` copies the compiled b-ber-reader bundle into the `_project/builds/reader/` output. This is the "reader build" pipeline step. Documented in b-ber-tasks/AGENTS.md.

### 6. State singleton coupling

`b-ber-lib/State` is a mutable singleton imported by virtually every package. Import count: 30+ files across the monorepo read from or write to it. This is the largest obstacle to isolated unit testing and build step parallelism. Not a blocker for TS migration, but the migration should not make it worse (no new State mutations should be added during conversion). Refactoring to dependency injection is a candidate for TASK-013 (Node.js modernization).

### 7. `process.exit(1)` in b-ber-logger

`log.error` calls `process.exit(1)` unconditionally. Library code must not do this. Tracked in TASK-011 (logger TS conversion). The correctness fix is: remove the exit from the logger; let `b-ber-cli` catch thrown errors and call `process.exit` at the top level.

## Additional Madge Capabilities

Beyond circular detection, madge provides:

| Command                                                   | Use                                                                                                                                                                                                                                             |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check:circular`                                  | Zero-cycle gate, run before any major refactor or in CI                                                                                                                                                                                         |
| `madge --orphans packages/<name>/src/`                    | Identifies files no other file imports — finds dead code. Note: `b-ber-tasks/src/web/{event-handlers,navigation,search,worker}.js` appeared as orphans but are loaded at runtime via `fs.readFileSync` for web build injection — not dead code. |
| `madge --image docs/dependency-graph.png packages/*/src/` | Generates a visual dependency graph (requires graphviz). Image committed to `docs/dependency-graph.png`.                                                                                                                                        |
| `madge --json packages/<name>/src/`                       | JSON dep graph for custom analysis (e.g. finding most-imported files, generating package-level summaries)                                                                                                                                       |

## Inter-Package Dependency Map

Derived from `package.json` `dependencies` fields; useful for planning TS project reference topology (TASK-008):

```
b-ber-shapes-directives   (leaf — no internal deps)
b-ber-shapes-dublin-core  (leaf)
b-ber-shapes-sequences    (leaf)
b-ber-theme-serif         → b-ber-theme-mixins
b-ber-theme-sans          → b-ber-theme-mixins, b-ber-theme-serif
b-ber-logger              (leaf)
b-ber-lib                 → b-ber-logger, b-ber-shapes-dublin-core, b-ber-shapes-sequences, b-ber-theme-serif, b-ber-theme-sans
b-ber-validator           → b-ber-shapes-directives
b-ber-templates           → b-ber-lib, b-ber-logger
b-ber-grammar-renderer    → b-ber-lib, b-ber-logger, b-ber-shapes-directives
b-ber-parser-*            → b-ber-lib, b-ber-logger, b-ber-shapes-directives, b-ber-templates
b-ber-grammar-*           → b-ber-grammar-attributes (most), b-ber-lib, b-ber-logger, b-ber-parser-*, b-ber-shapes-directives
b-ber-markdown-renderer   → all grammars, b-ber-parser-footnotes, b-ber-parser-gallery
b-ber-tasks               → b-ber-lib, b-ber-logger, b-ber-markdown-renderer, b-ber-reader, b-ber-resources, b-ber-shapes-sequences, b-ber-templates, b-ber-validator
b-ber-cli                 → b-ber-lib, b-ber-logger, b-ber-shapes-sequences, b-ber-tasks, b-ber-templates
```

This topology defines the correct TS project reference order for TASK-008: shapes → logger → lib → validator/templates → grammars/parsers → markdown-renderer → tasks → cli.

## Notes

- The 28 madge warnings are expected — they reflect external packages (lodash, fs-extra, etc.) that can't be resolved without following into node_modules; this is correct behavior.
- Orphan detection false positives: any file loaded via `fs.readFileSync` at runtime will appear as an orphan to static analysis tools. Always verify before treating an orphan as dead code.
- The circular import fixes are non-breaking: all imports still resolve to the same modules; only the import path changed (barrel → direct sibling).
