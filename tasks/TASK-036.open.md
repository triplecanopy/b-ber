# TASK-036: Upgrade Lerna and migrate off deprecated bootstrap

**Status:** not started
**Scope:** monorepo
**Priority:** high
**GitHub Issue:** #491 — https://github.com/triplecanopy/b-ber/issues/491

## Description

The monorepo uses Lerna v6.5.1. Lerna is maintained by Nx and has gone through
major breaking changes in v7 and v8 that directly affect how b-ber is developed,
built, and published:

- **Lerna v7** removed `lerna bootstrap` entirely (delegated to npm/yarn/pnpm
  workspaces). It also deprecated `lerna add` and `lerna link`. The version
  command and publish workflow were changed to align with Nx Cloud.
- **Lerna v8** further aligns with Nx, changes task runner defaults, and
  requires explicit `useWorkspaces` configuration.

Bootstrap is load-bearing in b-ber: `npm run bootstrap` calls
`lerna bootstrap`, which installs per-package node_modules and symlinks
first-party packages. Removing it requires enabling npm workspaces (or
keeping a manual equivalent). This must be done carefully — it affects:

- **Local development** (`npm run bootstrap`)
- **CI** (`.circleci/config.yml` calls `lerna bootstrap`)
- **Publishing** (`lerna publish` — the mechanism for cutting releases)

This task supersedes the research work in TASK-023.

## Subtasks

- [ ] **Read Lerna v7 + v8 migration guides** and map each breaking change to
      b-ber's actual usage (`lerna.json`, `package.json` scripts, CI config,
      publish workflow).
- [ ] **Evaluate workspaces strategy**: enable npm workspaces in root
      `package.json` (`"workspaces": ["packages/*"]`) as the replacement for
      `lerna bootstrap`. Verify symlink behaviour matches current bootstrap.
- [ ] **Evaluate whether to stay on Lerna or replace it**: - Stay on Lerna v8 (upgrade path, keep `lerna publish`, add workspaces) - Replace `lerna run` + `lerna publish` with `npm workspaces run` +
      `changeset` / `np` for publishing - Replace entirely with `nx` (Lerna's parent project)
      Recommendation should account for the publish workflow being the most
      critical concern.
- [ ] **Upgrade `lerna` in root `package.json`** to the chosen version.
- [ ] **Add `"workspaces": ["packages/*"]`** to root `package.json` if going
      the workspaces route (test that existing symlinks still resolve).
- [ ] **Update `npm run bootstrap`** script — remove or replace the
      `lerna bootstrap` call.
- [ ] **Update `lerna.json`** — remove deprecated fields (`npmClient`,
      `useWorkspaces` if handled elsewhere; add any v7/v8-required fields).
- [ ] **Test publishing workflow** on a dry run (`lerna publish --dry-run` or
      equivalent) before landing.
- [ ] **Update `AGENTS.md`** monorepo dev commands section to reflect the
      new bootstrap and build commands.
- [ ] **Coordinate with TASK-035** (CircleCI) — the CI config uses bootstrap;
      update it in the same pass or immediately after.

## Notes

Branch: `feat/upgrades`

**Publish workflow is the highest-risk area.** `lerna publish` handles version
bumping, changelog generation, git tagging, and npm publish for all 30+
packages simultaneously. Any regression here blocks releases. Test thoroughly
on a dry run before merging.

**Current `lerna.json`** — read this file before starting; it may have
settings that affect the upgrade path (e.g. `npmClient`, `command.bootstrap`
options, `useWorkspaces`).

**`--no-package-lock` and `--legacy-peer-deps`** — TASK-021 is an open audit
of these bootstrap flags. Coordinate: the bootstrap replacement is the right
time to resolve TASK-021 as well.

Related: [[TASK-023]] (prior research), [[TASK-021]] (bootstrap flags audit),
[[TASK-035]] (CircleCI — uses bootstrap)
