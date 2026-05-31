# b-ber monorepo — Project Plan

_Last updated: 2026-05-30_

---

## Goal

Modernize the b-ber monorepo in three parallel streams before releasing a new
stable version:

1. **Test coverage** (TASK-004) — raise coverage to ≥ 60% monorepo-wide before
   any large refactor
2. **Bundler replacement** (TASK-006/007) — replace webpack with Vite in
   `b-ber-reader-react` and `b-ber-reader`
3. **TypeScript migration** (TASK-008–012) — convert core packages to TypeScript,
   starting with the shared shapes/logger/lib layer

A fourth stream (Node.js modernization, TASK-013) follows the TypeScript migration.
Biome (TASK-015) is bundled with the Vite migration.

---

## Branch Strategy

| Branch                      | Role                                                                | Merges into     |
| --------------------------- | ------------------------------------------------------------------- | --------------- |
| `main`                      | stable, production-ready                                            | —               |
| `feat/upgrades`             | integration branch — planning, docs, and completed feature branches | `main`          |
| `feat/vite-migration`       | TASK-006, TASK-007, TASK-015                                        | `feat/upgrades` |
| `feat/ts-stage-1`           | TASK-008 through TASK-012                                           | `feat/upgrades` |
| `feat/node-modernization-*` | TASK-013 per-package slices                                         | `feat/upgrades` |

**All implementation work happens on feature branches** (or directly on
`feat/upgrades` for small, self-contained changes). Feature branches merge
into `feat/upgrades` once stable and tested. `feat/upgrades` merges to `main`
when a coherent set of work is complete and `npm test` passes cleanly from the
repo root.

Agents should never commit implementation work directly to `main`.

### Current branch state

`feat/upgrades` is ahead of `main` by 10 commits. Contents pending merge to main:

| Commit                                  | What it contains                 |
| --------------------------------------- | -------------------------------- |
| research tasks (TASK-001–003, TASK-005) | Webpack/TS/types/Biome research  |
| AGENTS.md + CLAUDE.md additions         | Package docs across all packages |
| TASK-004 implementation                 | b-ber-lib test suite (17% → 56%) |
| jest.config.js                          | Coverage exclusion fix           |
| Branch strategy + TASK-014/015 docs     | This planning layer              |

These commits are documentation and test-only changes — **safe to merge to
main at any time** once there are no test failures. No feature branches have
been created yet; implementation tasks (TASK-006+) have not started.

---

## Task Status

### Completed (research)

| Task     | Title                                     | Branch          |
| -------- | ----------------------------------------- | --------------- |
| TASK-001 | Research webpack replacement (chose Vite) | `feat/upgrades` |
| TASK-002 | Plan JS→TS migration strategy             | `feat/upgrades` |
| TASK-003 | Research type consolidation               | `feat/upgrades` |
| TASK-005 | Research Biome migration (chose Option B) | `feat/upgrades` |

### In progress

| Task     | Title                       | Branch          | Blocker                  |
| -------- | --------------------------- | --------------- | ------------------------ |
| TASK-004 | Monorepo-wide test coverage | `feat/upgrades` | Ongoing per-package work |
| TASK-014 | GitHub issue tracking setup | `feat/upgrades` | Issue creation deferred  |

### Not started — can begin now

These tasks have no unmet dependencies:

| Task     | Title                                            | Branch                | Notes                                     |
| -------- | ------------------------------------------------ | --------------------- | ----------------------------------------- |
| TASK-006 | Migrate b-ber-reader-react webpack → Vite        | `feat/vite-migration` | Independent of test coverage              |
| TASK-008 | Set up shared TypeScript infrastructure          | `feat/ts-stage-1`     | Independent; prereq for TASK-009–012      |
| TASK-016 | Detect and resolve circular imports + arch risks | `feat/upgrades`       | Run before TASK-008; low blast radius     |
| TASK-017 | Expand diagrams: tooling versions + cross-refs   | `feat/upgrades`       | Living audit surface; pairs with TASK-016 |

### Not started — blocked

| Task     | Title                                              | Waiting on                     |
| -------- | -------------------------------------------------- | ------------------------------ |
| TASK-007 | Migrate b-ber-reader to Vite                       | TASK-006                       |
| TASK-009 | Convert b-ber-shapes-directives to TS              | TASK-008                       |
| TASK-010 | Convert b-ber-shapes-dublin-core + sequences to TS | TASK-009                       |
| TASK-011 | Convert b-ber-logger to TS                         | TASK-008                       |
| TASK-012 | Convert b-ber-lib to TS                            | TASK-009, TASK-010, TASK-011   |
| TASK-013 | Node.js modernization                              | TASK-012 (TS stage 1 complete) |
| TASK-015 | Biome migration                                    | TASK-006 (same branch)         |

---

## Dependency Graph

```
TASK-004 (test coverage) ─────────────────────────────────────────┐
  per-package subtasks (b-ber-lib ✓, b-ber-tasks, grammars, ...)  │
                                                                    ▼
TASK-006 (Vite: reader-react)                            TASK-008 (tsconfig infra)
  └─ TASK-007 (Vite: reader)                               ├─ TASK-009 (shapes-directives TS)
  └─ TASK-015 (Biome)          [same branch]               │    └─ TASK-010 (shapes-dc + seq TS)
       │                                                    ├─ TASK-011 (logger TS)
       │                                                    └─ TASK-012 (lib TS) ← needs 009+010+011
       │                                                         │
       └─────────────────────────────────────────────────────────┤
                                                                  ▼
                                                         TASK-013 (Node.js modernization)
```

Notes:

- TASK-004 is a soft prerequisite for the TS migration: do not start TASK-008+
  until overall coverage is ≥ 60%.
- TASK-006 and TASK-008 are fully independent and can run in parallel.
- TASK-010 and TASK-011 are independent of each other (both depend on TASK-008).
- TASK-015 (Biome) is bundled with TASK-006/007 on the same branch.

---

## Per-Package Test Coverage (TASK-004 sub-tasks)

These are tracked as `TASK-001.open.md` within each package's `tasks/` directory.

| Package                    | Starting coverage | Current | Target | Status      |
| -------------------------- | ----------------- | ------- | ------ | ----------- |
| b-ber-lib                  | 17%               | 71%     | ≥ 70%  | complete    |
| b-ber-tasks                | ~0%               | ~15%    | ~25%\* | in progress |
| b-ber-logger               | 0%                | 73%     | ≥ 60%  | in progress |
| b-ber-markdown-renderer    | 0%                | 83%     | ≥ 60%  | complete    |
| b-ber-cli                  | 24%               | 65%     | ≥ 60%  | complete    |
| b-ber-templates            | mixed             | 96%     | ≥ 60%  | complete    |
| b-ber-validator            | 69%               | 69%     | ≥ 80%  | not started |
| b-ber-grammar-\* (14 pkgs) | 0%                | ~80%    | ≥ 60%  | in progress |
| b-ber-parser-\* (5 pkgs)   | 0%                | ~90%    | ≥ 60%  | in progress |
| b-ber-reader-react         | mixed             | mixed   | ≥ 60%  | not started |

Priority order: ~~b-ber-logger~~ ✓ → ~~b-ber-templates~~ ✓ → ~~grammar/parser stubs~~ ✓ → reader-react.

\*b-ber-tasks: most pipeline steps (web, reader, pdf, sass, epub, etc.) require a full project
directory + external tools (Calibre, wkhtmltopdf). Realistic ceiling for pure unit tests is ~25%.
This is documented in packages/b-ber-tasks/tasks/TASK-001.open.md.

---

## What To Do Next

In priority order:

1. **TASK-004 coverage targets met**: All coverage targets are now met —
   b-ber-lib 71%, grammar/parser packages ~60-97%, b-ber-markdown-renderer 83%,
   b-ber-cli 65%, b-ber-logger 73%, b-ber-templates 96%. TASK-008 can now start.
2. **TASK-016** (circular imports + arch risks): run madge, fix cycles, document structural
   risks (mixed CJS/ESM, implicit deps, process.exit in logger, stale deps). Low blast radius,
   high value before the TS migration.
3. **Start TASK-006** (Vite migration): no blockers, medium priority. Branch:
   `feat/vite-migration`. Also picks up TASK-015 (Biome) and TASK-007 (reader).
4. **Start TASK-008** (TypeScript infra): gated on overall coverage ≥60%. Branch:
   `feat/ts-stage-1`. Unlocks the entire TS migration chain. Build pipeline approach:
   replace `babel-jest` with `@swc/jest` (drop-in, Rust-based, 10-20× faster);
   replace Babel build step with `tsup` (esbuild-based, designed for TS library packages,
   handles `.d.ts` generation); add root `tsconfig.base.json` for `tsc --noEmit` type
   checking only. Babel removed entirely after all packages are converted (post-TASK-012).
5. **Complete TASK-014** (GitHub issues): create retroactive issues for closed
   tasks and open issues for in-progress/upcoming tasks.

---

## Merge Checklist (before merging `feat/upgrades` → `main`)

- [ ] `npm test` passes from repo root (all ~74 suites)
- [ ] No `.open.md` tasks at high priority left untouched
- [ ] `PLAN.md` is current
- [ ] Any new feature branches have been either merged or noted as in-progress
