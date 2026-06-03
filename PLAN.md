# b-ber monorepo — Project Plan

_Last updated: 2026-06-03 (TASK-036 complete — Lerna v8.2.4, npm workspaces, bootstrap removed from scripts and CI)_

---

## Goal

Modernize the b-ber monorepo in three parallel streams before releasing a new
stable version:

1. **Test coverage** (TASK-004) — raise coverage to ≥ 75% monorepo-wide before
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
| `feat/ts-stage-2`           | TASK-024 through TASK-028 (grammar, parser, templates, md-renderer) | `feat/upgrades` |
| `feat/ts-stage-3`           | TASK-029 through TASK-031 (tasks, cli)                              | `feat/upgrades` |

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

| Task     | Title                                              | Branch            |
| -------- | -------------------------------------------------- | ----------------- |
| TASK-001 | Research webpack replacement (chose Vite)          | `feat/upgrades`   |
| TASK-002 | Plan JS→TS migration strategy                      | `feat/upgrades`   |
| TASK-003 | Research type consolidation                        | `feat/upgrades`   |
| TASK-005 | Research Biome migration (chose Option B)          | `feat/upgrades`   |
| TASK-016 | Circular import audit + arch risk catalog          | `feat/upgrades`   |
| TASK-019 | Pre-TS migration cleanup                           | `feat/upgrades`   |
| TASK-034 | Upgrade Jest from v26 to v29                       | `feat/upgrades`   |
| TASK-036 | Upgrade Lerna and migrate off bootstrap            | `feat/upgrades`   |
| TASK-048 | Convert b-ber-resources to TypeScript              | `feat/upgrades`   |
| TASK-008 | Set up shared TypeScript infrastructure            | `feat/ts-stage-1` |
| TASK-009 | Convert b-ber-shapes-directives to TS              | `feat/ts-stage-1` |
| TASK-010 | Convert b-ber-shapes-dublin-core + sequences to TS | `feat/ts-stage-1` |
| TASK-011 | Convert b-ber-logger to TS                         | `feat/ts-stage-1` |
| TASK-012 | Convert b-ber-lib to TS                            | `feat/ts-stage-1` |
| TASK-025 | Convert b-ber-grammar-\* to TypeScript             | `feat/ts-stage-2` |
| TASK-026 | Convert b-ber-parser-\* to TypeScript              | `feat/ts-stage-2` |
| TASK-027 | Convert b-ber-templates to TypeScript              | `feat/ts-stage-2` |
| TASK-028 | Convert b-ber-markdown-renderer to TypeScript      | `feat/ts-stage-2` |
| TASK-029 | TypeScript Stage 3 parent                          | `feat/ts-stage-3` |
| TASK-030 | Convert b-ber-tasks to TypeScript                  | `feat/ts-stage-3` |
| TASK-031 | Convert b-ber-cli to TypeScript                    | `feat/ts-stage-3` |

### In progress

| Task     | Title                       | Branch          | Blocker                  |
| -------- | --------------------------- | --------------- | ------------------------ |
| TASK-004 | Monorepo-wide test coverage | `feat/upgrades` | Ongoing per-package work |
| TASK-014 | GitHub issue tracking setup | `feat/upgrades` | Issue creation deferred  |

### Not started — can begin now

These tasks have no unmet dependencies:

| Task     | Title                                            | Branch                 | Notes                                                                                     |
| -------- | ------------------------------------------------ | ---------------------- | ----------------------------------------------------------------------------------------- |
| TASK-006 | Migrate b-ber-reader-react webpack → Vite        | `feat/vite-migration`  | Independent of TS work                                                                    |
| TASK-017 | Expand diagrams: tooling versions + cross-refs   | `feat/upgrades`        | Living audit surface; TASK-016 complete                                                   |
| TASK-021 | Audit `--no-package-lock` in lerna bootstrap     | `feat/upgrades`        | Low priority; review alongside `--legacy-peer-deps`                                       |
| TASK-022 | Automate circular dependency checks              | `feat/upgrades`        | Options: pre-commit hook, CI, or `npm test`; update extensions list once TS work starts   |
| TASK-023 | Research Lerna replacement / upgrade options     | `feat/upgrades`        | Superseded by TASK-036; keep for research notes                                           |
| TASK-033 | Evaluate code coverage tooling                   | `feat/upgrades`        | ✓ Complete — V8 provider confirmed; coveralls/istanbul orphans removed; TASK-049 opened   |
| TASK-034 | Upgrade Jest from v26 to v29                     | `feat/upgrades`        | ✓ Complete — 84/84 suites pass; v8 coverage provider, snapshots updated                   |
| TASK-035 | Fix and modernize CircleCI pipeline              | `feat/upgrades`        | Stale Docker image; bootstrap step removed; only runs on main; unblocked by TASK-036      |
| TASK-037 | Replace or reconfigure dependency management     | `feat/upgrades`        | Dependabot paused + broken config; evaluate Options A–D; recommend remove + npm audit     |
| TASK-038 | Audit and clean up package.json scripts          | `feat/upgrades`        | Inconsistent naming, dead scripts, opaque chains; some cleanup now, rest after migrations |
| TASK-039 | E2E testing umbrella                             | `feat/upgrades`        | CLI smoke + reader browser tests; may become `b-ber-testing` package; **high priority**   |
| TASK-040 | E2E testing — research: tooling + fixture        | `feat/upgrades`        | Playwright vs alternatives; kitchen-sink fixture design; package boundary decision        |
| TASK-041 | E2E testing — kitchen-sink fixture project       | `feat/upgrades`        | Covers all directives; blocked on TASK-040 for location decision                          |
| TASK-042 | E2E testing — CLI smoke tests                    | `feat/upgrades`        | `bber new`, `bber build` variants, artifact assertions; blocked on TASK-040 + TASK-041    |
| TASK-045 | Refactor changelog generation + release workflow | `feat/upgrades`        | Manual, fragile sequencing; evaluate changesets / release-please / AI-assisted drafting   |
| TASK-046 | Refactor b-ber-logger                            | `feat/logger-refactor` | Bind pattern → class methods; remove process.exit from log.error; remove argv parsing     |
| TASK-047 | Research watch mode scripts for dev workflow     | `feat/upgrades`        | Most packages lack a `watch` script; define target state per package type                 |
| TASK-049 | Evaluate coverage report upload services         | `feat/upgrades`        | No service currently active; assess Codecov, Coveralls, GitHub Actions summary            |

### Not started — blocked

| Task     | Title                                              | Waiting on                         |
| -------- | -------------------------------------------------- | ---------------------------------- |
| TASK-007 | Migrate b-ber-reader to Vite                       | TASK-006                           |
| TASK-013 | Node.js modernization                              | TASK-012 ✓ — **can begin now**     |
| TASK-015 | Biome migration                                    | TASK-006 (same branch)             |
| TASK-032 | Convert b-ber-reader-react to TypeScript (Stage 4) | TASK-006 (Vite migration complete) |
| TASK-043 | E2E testing — reader browser tests (Playwright)    | TASK-040 (research) + TASK-041     |
| TASK-044 | E2E testing — CI integration                       | TASK-043 (reader tests stable)     |

---

## Dependency Graph

```
TASK-004 (test coverage) ─────────────────────────────────────────────────────────────┐
  per-package subtasks (b-ber-lib ✓, b-ber-tasks, grammars, ...)                      │
                                                                                      ▼
TASK-006 (Vite: reader-react)                            TASK-008 ✓ (tsconfig infra)
  └─ TASK-007 (Vite: reader)                               ├─ TASK-009 ✓ (shapes-directives TS)
  └─ TASK-015 (Biome)          [same branch]               │    └─ TASK-010 ✓ (shapes-dc + seq TS)
       │                                                   ├─ TASK-011 ✓ (logger TS)
       │                                                   └─ TASK-012 ✓ (lib TS)
       │                                                         │
       │                                              TASK-024 (Stage 2 parent)
       │                                                ├─ TASK-025 (grammar-* TS)  ─┐
       │                                                ├─ TASK-026 (parser-* TS)    ├─ TASK-028 (markdown-renderer TS)
       │                                                └─ TASK-027 (templates TS)  ─┘
       │                                                         │
       │                                              TASK-029 (Stage 3 parent)
       │                                                ├─ TASK-030 (tasks TS)
       │                                                └─ TASK-031 (cli TS)
       │                                                         │
       └─────────────────────────────────────────────────────────┤
                                                                 ▼
                                                    TASK-032 (reader-react TS, Stage 4)
                                                    TASK-013 (Node.js modernization)
```

Notes:

- TASK-004 is a soft prerequisite for the TS migration: do not start TASK-008+
  until overall coverage is ≥ 60%.
- TASK-006 and Stage 2 TS work are fully independent and can run in parallel.
- TASK-025, TASK-026, TASK-027 are independent of each other within Stage 2.
- TASK-028 must come after TASK-025 + TASK-026 (imports all grammar/parser packages).
- TASK-015 (Biome) is bundled with TASK-006/007 on the same branch.
- TASK-032 is blocked on TASK-006 (Vite) — do not attempt reader-react TS on webpack.

---

## Per-Package Test Coverage (TASK-004 sub-tasks)

These are tracked as `TASK-001.open.md` within each package's `tasks/` directory.

| Package                    | Starting coverage | Current | Target | Status      |
| -------------------------- | ----------------- | ------- | ------ | ----------- |
| b-ber-lib                  | 17%               | 71%     | ≥ 75%  | in progress |
| b-ber-tasks                | ~0%               | ~15%    | ~25%\* | in progress |
| b-ber-logger               | 0%                | 73%     | ≥ 75%  | in progress |
| b-ber-markdown-renderer    | 0%                | 83%     | ≥ 75%  | complete    |
| b-ber-cli                  | 24%               | 65%     | ≥ 75%  | in progress |
| b-ber-templates            | mixed             | 96%     | ≥ 75%  | complete    |
| b-ber-validator            | 69%               | 69%     | ≥ 80%  | not started |
| b-ber-grammar-\* (14 pkgs) | 0%                | ~80%    | ≥ 75%  | in progress |
| b-ber-parser-\* (5 pkgs)   | 0%                | ~90%    | ≥ 75%  | in progress |
| b-ber-reader-react         | mixed             | mixed   | ≥ 75%  | not started |

Priority order: ~~b-ber-logger~~ ✓ → ~~b-ber-templates~~ ✓ → ~~grammar/parser stubs~~ ✓ → reader-react.

_Note: minimum coverage target raised from 60% to 75% on 2026-06-02. Packages previously
marked complete at ≥ 60% (b-ber-lib at 71%, b-ber-logger at 73%, b-ber-cli at 65%)
are reopened; they need additional tests to reach 75%._

\*b-ber-tasks: most pipeline steps (web, reader, pdf, sass, epub, etc.) require a full project
directory + external tools (Calibre, wkhtmltopdf). Realistic ceiling for pure unit tests is ~25%.
This is documented in packages/b-ber-tasks/tasks/TASK-001.open.md.

---

## What To Do Next

In priority order:

1. **Start TASK-040** (E2E research): high priority — tooling decision
   unblocks TASK-041/042/043. Should be fast (a day or two of evaluation).
   Leading candidate: Playwright in a new `b-ber-testing` package.
2. **TASK-036 complete** — Lerna upgraded to v8.2.4; npm workspaces added;
   `lerna bootstrap` replaced with `npm install`; CI bootstrap step removed;
   `lerna.json` repaired. All 84 test suites pass.
3. **Start TASK-035** (Fix CircleCI): bootstrap blocker is now resolved.
   Remaining work: stale Docker image, only runs on main branch, test step
   config.
4. **TASK-033 complete** — V8 coverage provider confirmed; `coveralls`,
   `istanbul`, `istanbul-api`, `istanbul-reports` removed from root
   `package.json`. TASK-049 opened for coverage upload evaluation (low priority).
5. **Stage 3 complete** (TASK-029–031 ✓): both `b-ber-tasks` and `b-ber-cli`
   are now TypeScript. `feat/ts-stage-3` merged into `feat/upgrades`.
   TASK-032 (reader-react TS, Stage 4) is still blocked on TASK-006 (Vite).
6. **Start TASK-006** (Vite migration): independent of TS work, can run in
   parallel. Branch: `feat/vite-migration`. Also picks up TASK-015 (Biome) and
   TASK-007 (reader).
7. **TASK-037** (Dependency management): low effort if Option A — remove
   Dependabot and add `npm audit` to CI. Can be done alongside TASK-035.
8. **TASK-038** (package.json script cleanup): some items unblocked now (theme
   packages, root dead scripts). Remaining cleanup is downstream of TASK-006,
   TASK-029–031 ✓, and TASK-036 — do those pieces as part of those tasks.

---

## Merge Checklist (before merging `feat/upgrades` → `main`)

- [ ] `npm test` passes from repo root (all ~74 suites)
- [ ] No `.open.md` tasks at high priority left untouched
- [ ] `PLAN.md` is current
- [ ] Any new feature branches have been either merged or noted as in-progress
