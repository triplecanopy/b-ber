# TASK-021: Audit and document `--no-package-lock` in lerna bootstrap

**Status:** superseded
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** low
**GitHub Issue:** #481 — https://github.com/triplecanopy/b-ber/issues/481

## Description

`lerna bootstrap --hoist` runs `npm install --no-package-lock` inside each
package directory. The flag was added at some point to suppress per-package
lockfiles, but the reasoning has not been documented. Before the TypeScript
migration (TASK-020) and any further dependency work, it is worth confirming
the intent and whether the flag is still correct.

**Working hypothesis:** in a hoisted Lerna monorepo the root `package-lock.json`
is the single authoritative lockfile. Hoisting moves all shared dependencies up
to `node_modules/` at the repo root, so the individual package `node_modules/`
directories are sparse (only non-hoisted deps live there). Generating a lockfile
inside each package during bootstrap would describe a partial, misleading
dependency tree and could drift out of sync with the root lock. Suppressing
per-package locks keeps the root lock as the source of truth.

If that hypothesis is correct, the flag is intentional and should stay. The task
is to verify it and add a short comment or note so future contributors understand
why it is there.

## Subtasks

- [ ] Confirm whether any packages currently have their own `package-lock.json`
      files checked in or generated at install time
- [ ] Trace the git history for when `--no-package-lock` was added and why
      (e.g. `git log -S 'no-package-lock' -- lerna.json`)
- [ ] Verify the hoisting behaviour: run bootstrap without the flag in a clean
      branch and inspect what lockfiles are created and whether they are correct
- [ ] Check whether Lerna v6/v7 or npm workspaces changes the recommendation
      (newer Lerna versions with `useWorkspaces: true` handle this differently)
- [ ] Document the conclusion — either add a comment to `lerna.json` or record
      the decision here in Notes

## Notes

**Superseded by TASK-036 (Lerna v8 + drop bootstrap).** The `lerna bootstrap --hoist`
command was removed entirely; the repo now uses npm workspaces with a single
authoritative root `package-lock.json`. The `--no-package-lock` flag no longer
exists and there is nothing to audit. No replacement task needed.

(Historical context: the flag sat in `lerna.json` under
`command.bootstrap.npmClientArgs`, intended to suppress per-package lockfiles
in favor of hoisted root lock; but the infrastructure is now gone.)

Related: [[TASK-036]] (Lerna v8 upgrade, where bootstrap was removed).
