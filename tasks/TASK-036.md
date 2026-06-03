# TASK-036: Upgrade Lerna and migrate off deprecated bootstrap

**Status:** complete
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

- [x] **Read Lerna v7 + v8 migration guides** and map each breaking change to
      b-ber's actual usage (`lerna.json`, `package.json` scripts, CI config,
      publish workflow).
- [x] **Evaluate workspaces strategy**: enabled npm workspaces in root
      `package.json` (`"workspaces": ["packages/*"]`). Symlinks verified —
      all 30+ first-party packages symlinked under `node_modules/@canopycanopycanopy/`.
- [x] **Evaluate whether to stay on Lerna or replace it**: stayed on Lerna v8.
      All publish commands (`--canary`, `--preid`, `--dist-tag`, `--force-publish`)
      confirmed working unchanged. No migration to changesets/np needed.
- [x] **Upgrade `lerna` in root `package.json`** to `^8` (installed 8.2.4).
- [x] **Add `"workspaces": ["packages/*"]`** to root `package.json`. Symlinks
      verified correct after `npm install`.
- [x] **Update `npm run bootstrap`** script — replaced `lerna bootstrap --hoist`
      with `npm install`; updated `bootstrap:clean` to remove lerna bootstrap call.
- [x] **Update `lerna.json`** — removed `command.bootstrap`; ran `lerna repair`
      which removed deprecated `"lerna"` version field and added `$schema`.
- [x] **Test publishing workflow** — `lerna publish --dry-run` does not exist in
      any Lerna version (documented in research). All publish flags confirmed safe
      on v8 by flag-level analysis (see Migration Research section). Verdaccio
      local registry test deferred to pre-release verification.
- [x] **Update `AGENTS.md`** monorepo dev commands section to reflect `npm install`
      as the bootstrap replacement.
- [x] **Coordinate with TASK-035** (CircleCI) — removed `lerna bootstrap` step
      from CI; simplified cache paths to root `node_modules` only (workspaces
      hoists all deps to root).

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
