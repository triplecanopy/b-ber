# TASK-035: Fix and modernize the CircleCI pipeline

**Status:** not started
**Scope:** monorepo
**Priority:** high
**GitHub Issue:** #490 — https://github.com/triplecanopy/b-ber/issues/490

## Description

The CircleCI pipeline (`.circleci/config.yml`) has been failing and is
effectively non-functional. The config was written in 2019 and has not been
updated to reflect changes to Node.js versions, npm, Lerna, or the package
structure. It cannot pass in its current form and needs a ground-up rewrite.

Known issues in the current config:

1. **Stale Docker image** — uses `canopycanopycanopy/b-ber:1.0.1`, a custom
   image of unknown origin with an unknown Node.js version. Should be replaced
   with a standard `cimg/node` CircleCI convenience image pinned to a current
   LTS (e.g. Node 22).
2. **`lerna bootstrap`** — deprecated in Lerna v7 and removed in v8. The CI
   script calls `npm run lerna bootstrap` which will break once Lerna is
   upgraded (TASK-036).
3. **`branches: only: main`** — pipeline only runs on push to `main`, not on
   pull requests or feature branches. PRs are unvalidated.
4. **Manual `save_cache` package list** — explicitly lists every package's
   `node_modules` directory. This list is stale (missing new packages, wrong
   paths after restructuring) and brittle to maintain.
5. **`npm ci --ignore-scripts` + `lerna bootstrap`** — conflicting approach.
   `--ignore-scripts` prevents `prepare` hooks from running but then bootstrap
   re-installs per-package deps anyway. Should be replaced with a single
   workspace-aware install.
6. **`npm run reader:shim`** — undocumented step; verify what it does and
   whether it is still necessary after TASK-006 (Vite migration).
7. **`$BBER` smoke test** — final step installs and exercises the CLI via an
   env var. Valuable integration test but needs the env var documented and set
   in CircleCI project settings.
8. **CircleCI 2.0 config** — should be updated to 2.1 to access orbs,
   reusable commands, and executors.

## Subtasks

- [ ] **Audit `reader:shim` script** — determine if it is still needed after
      Vite migration lands; document it if so.
- [ ] **Rewrite config to CircleCI 2.1** using `cimg/node:22.x` executor.
- [ ] **Replace `lerna bootstrap`** with workspace-aware `npm ci` (coordinate
      with TASK-036 — do after Lerna is upgraded and bootstrap is removed).
- [ ] **Add PR validation** — run the test suite on all branches/PRs, not just
      `main`.
- [ ] **Replace manual cache list** with a hash-keyed cache of `node_modules`
      at the root and a glob pattern for per-package installs.
- [ ] **Document and set `$BBER` env var** in CircleCI project settings;
      keep the smoke test.
- [ ] **Verify the pipeline passes** end-to-end on a test branch before merging.

## Notes

Branch: `feat/upgrades` (or a dedicated `feat/ci-fix` branch if the changes are
large enough to warrant isolation)

This task is **blocked on TASK-036** (Lerna upgrade) for the bootstrap step.
The config rewrite can be drafted before TASK-036 is complete, but the final
pipeline should not be merged until the Lerna upgrade lands so bootstrap is
not re-introduced.

Whether to keep CircleCI or migrate to GitHub Actions is out of scope for this
task. Note it in the Notes if there is a strong reason to switch, but do not
change CI platform here.

Related: [[TASK-036]] (Lerna upgrade — removes bootstrap), [[TASK-034]] (Jest
upgrade — changes test command), [[TASK-006]] (Vite migration — changes build
commands)
