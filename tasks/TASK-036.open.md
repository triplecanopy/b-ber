# TASK-036: Upgrade Lerna and migrate off deprecated bootstrap

**Status:** in progress
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

---

## Migration Research: v6 → v7 → v8

_Findings from mapping the v7 and v8 migration guides against b-ber's actual
usage. Completed 2026-06-03._

### Current state (v6.6.2)

**`lerna.json`:**
```json
{
  "lerna": "4.0.0",
  "packages": ["packages/*"],
  "npmClient": "npm",
  "version": "3.1.0",
  "command": {
    "publish": { "message": "%v" },
    "bootstrap": { "npmClientArgs": ["--no-package-lock", "--legacy-peer-deps"] },
    "version": { "exact": true }
  }
}
```

**`package.json` scripts that use Lerna:**
```
bootstrap        → lerna bootstrap --hoist
bootstrap:clean  → lerna clean --yes && npm i && lerna bootstrap --hoist && ...
watch            → lerna run watch --stream
build            → lerna run build --scope=... (two invocations)
publish:canary   → lerna publish --canary
publish:latest   → lerna publish
publish:lts-2    → lerna publish -- --dist-tag lts-2
outdated         → lerna exec --no-bail -- npm outdated
typecheck        → lerna run typecheck
```

**`.circleci/config.yml`:**
```
npm run lerna bootstrap -- --no-ci --concurrency=2
```

**Ad-hoc publish commands (from task description):**
```
lerna publish -- --canary --preid <name> --dist-tag <name> --force-publish="*"
lerna publish -- --force-publish="*"
```

---

### v7.0.0 breaking changes (June 2023)

#### 1. `lerna bootstrap`, `lerna add`, `lerna link` removed by default

**Impact on b-ber: CRITICAL.** This is the only breaking change that requires
work before upgrading.

- `bootstrap`, `add`, and `link` are no longer bundled with `lerna`.
- **Opt-in for v7/v8:** Install `@lerna/legacy-package-management` at the same
  version as `lerna` to restore these commands temporarily.
- **v9 note:** The opt-in package was permanently removed in v9.0.0 (Sept 2025).
  The opt-in buys time but is not a long-term solution — the right migration is
  npm workspaces (see subtask: Evaluate workspaces strategy).

What breaks without the opt-in:
- `npm run bootstrap` (`lerna bootstrap --hoist`)
- `npm run bootstrap:clean` (`lerna bootstrap --hoist`)
- CircleCI: `npm run lerna bootstrap -- --no-ci --concurrency=2`

#### 2. `useWorkspaces` field removed from `lerna.json`

**Impact on b-ber: none.** b-ber's `lerna.json` does not use `useWorkspaces`.
In v7, workspaces are read automatically from the package manager's config
rather than requiring an explicit Lerna flag. No lerna.json change needed for
this.

#### 3. `lerna init` cannot run on existing repositories

**Impact on b-ber: none.** Use `lerna repair` to migrate `lerna.json` fields
after upgrading. This is a one-time operation.

#### 4. Deprecated flags removed

These flags were removed in v7 because they had already been renamed in v5/v6:

| Removed flag              | Correct replacement                |
| ------------------------- | ---------------------------------- |
| `--includeFilteredDependencies` | `--includeDependencies`      |
| `--includeFilteredDependents`   | `--includeDependents`        |
| `--githubRelease`         | `--createRelease=github`           |
| `--skipGit`               | `--push=false --gitTagVersion=false` |
| `--repoVersion`           | positional bump argument            |
| `--cdVersion`             | positional bump argument            |
| `--npmTag`                | `--dist-tag` (hyphenated)          |
| `--ignore`                | `--ignoreChanges`                  |

**Impact on b-ber: none.** b-ber already uses the modern `--dist-tag`
(not `--npmTag`). None of the other removed flags are used.

#### 5. Node 14 dropped

**Impact on b-ber: low.** b-ber's `package.json` has `"node": ">= 10.x"` which
is stale but doesn't affect Lerna's own requirements. The engines field should
be updated anyway as a separate concern.

---

### v8.0.0 breaking changes (December 2023)

#### 1. Node 16 dropped

Minimum Node version is now 18. **Impact on b-ber: low** — same as above, the
engines field is stale and needs updating independently.

#### 2. `lerna run` now uses Nx v17 (was v16)

**Impact on b-ber: none in practice.** The Nx task runner only changes `lerna
run` behaviour when `nx.json` exists at the repo root with `targetDefaults`
defined, and/or packages have an `"nx"` key in their `package.json`. b-ber has
neither. Without Nx configuration, `lerna run` continues to use its own
internal scheduler.

#### 3. 65+ legacy `@lerna/` packages deprecated on npm

These are internal implementation packages from the pre-Nx era of Lerna. They
are not direct b-ber dependencies. **Impact on b-ber: none.**

#### 4. `@lerna/child-process` no longer published

An internal package that was never part of the public API.
**Impact on b-ber: none.**

---

### Publish command analysis

This is the highest-risk area. All flags used by b-ber are confirmed working
in v7 and v8:

| Flag | b-ber usage | v7/v8 status | Notes |
|------|-------------|--------------|-------|
| `--canary` | ✓ used | ✓ supported | Unchanged |
| `--preid <name>` | ✓ used | ✓ supported | Canary-only flag; default is `alpha` |
| `--dist-tag <name>` | ✓ used | ✓ supported | Correct modern form (not `--npmTag`) |
| `--force-publish="*"` | ✓ used | ✓ supported | `*` glob publishes all packages |
| `--dist-tag lts-2` | ✓ used | ✓ supported | Non-canary dist-tag publish |

The full canary command is safe to run unchanged on v7/v8:
```
lerna publish --canary --preid <name> --dist-tag <name> --force-publish="*"
```

The full simultaneous publish is also safe:
```
lerna publish --force-publish="*"
```

---

### Dry-run option

**`lerna publish --dry-run` does not exist** in any Lerna version, including
v6, v7, and v8. It was never implemented. The current task description's
reference to it as `lerna publish --dry-run` (or equivalent) is correct to
hedge with "or equivalent".

**Available dry-run alternatives:**

1. **Local registry (recommended):** Spin up [Verdaccio](https://verdaccio.org)
   locally and publish to it with `--registry http://localhost:4873`. This is
   the closest to a real publish test without touching npm.
   ```
   lerna publish --canary --preid test --dist-tag test \
     --force-publish="*" --registry http://localhost:4873
   ```

2. **`lerna publish from-package --dry-run` via `--no-push` + manual diff:**
   Not a real dry-run, but running `lerna version --no-push
   --no-git-tag-version` locally will show which packages would be bumped
   without creating commits or tags.

3. **`npm pack` per package:** Run `npm pack --dry-run` in individual package
   directories to verify tarball contents before publishing.

---

### `lerna.json` changes needed for v8

Current fields and their v8 status:

| Field | Current value | v8 status | Action |
|-------|--------------|-----------|--------|
| `"lerna"` | `"4.0.0"` | Schema version — run `lerna repair` to update | Run `lerna repair` post-upgrade |
| `"packages"` | `["packages/*"]` | Still valid | No change |
| `"npmClient"` | `"npm"` | Still valid | No change |
| `"version"` | `"3.1.0"` | Still valid (fixed mode) | No change |
| `command.publish.message` | `"%v"` | Still valid | No change |
| `command.bootstrap` | `{npmClientArgs: [...]}` | Key is vestigial once bootstrap is gone | Remove after bootstrap migration |
| `command.version.exact` | `true` | Still valid | No change |

The `command.bootstrap.npmClientArgs` entry (`["--no-package-lock", "--legacy-peer-deps"]`)
is the bootstrap-flags concern tracked in TASK-021. These flags will need to be
re-evaluated in the context of npm workspaces (where they may need to move to
`.npmrc` or root `package.json`'s `config` section instead).

---

### Summary: what must change vs. what is safe

**Must change before v7/v8 can be used:**
- `lerna bootstrap` calls in `package.json` scripts and CircleCI config
  (replaced by `npm install` + npm workspaces, or temporarily by
  `@lerna/legacy-package-management`)

**Safe to leave as-is (no action required):**
- All `lerna publish` commands including canary workflow
- All `lerna run` commands
- `lerna exec`, `lerna clean`
- `lerna.json` fields (except `command.bootstrap` which becomes vestigial)
- `--canary`, `--preid`, `--dist-tag`, `--force-publish` flags

**Correction to task Description (line 14–17):** v7 did not "deprecate" `add`
and `link` — it removed them outright along with `bootstrap`. And v8 does NOT
require explicit `useWorkspaces` configuration — v7 removed `useWorkspaces`
and made workspace detection automatic.
