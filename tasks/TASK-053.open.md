# TASK-053: Replace lerna-update-wizard with modern dep tooling

**Status:** not started
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #520 — https://github.com/triplecanopy/b-ber/issues/520

## Description

b-ber uses `lerna-update-wizard` (`lernaupdate`) for two scripts:

```json
"deps:update": "lernaupdate",
"deps:dedupe": "lernaupdate --dedupe"
```

`lerna-update-wizard` provides an interactive UI for updating dependencies
across all packages in the monorepo and deduplicating version mismatches.
It relies on `lerna bootstrap` internally, which is removed in Lerna v7+
(TASK-036), so it will break when the Lerna upgrade lands.

Two modern tools together cover the same ground:

- **`syncpack`** — checks and fixes version mismatches across all
  `package.json` files in the monorepo. Direct replacement for the
  `--dedupe` use case.
- **`npm-check-updates` (`ncu`) with `--workspaces`** — interactive
  dep upgrades across all workspace packages. Replacement for the
  interactive update UI.

This task is to research both tools in the context of b-ber's monorepo
structure and confirm the replacement workflow before removing
`lerna-update-wizard`.

## Subtasks

- [ ] **Audit `lerna-update-wizard` usage** — confirm `deps:update` and
      `deps:dedupe` are the only call sites. Check if any CI steps or
      documented workflows reference `lernaupdate`.
- [ ] **Research `syncpack`** — run `npx syncpack list-mismatches` against
      the current repo and review output. Confirm the fix strategy
      (`fix-mismatches`) aligns to b-ber's versioning policy (fixed mode,
      all packages at the same version). Determine whether `syncpack` needs
      a config file (`syncpack.config.js` or `.syncpackrc`).
- [ ] **Research `ncu --workspaces`** — run `npx ncu --workspaces` and review
      output. Test the `--interactive` flag. Confirm it works without npm
      workspaces being configured in `package.json` yet, or note that it
      depends on the workspaces migration in TASK-036.
- [ ] **Decide on tool versions** — add as devDependencies in root
      `package.json` or keep as `npx`-only invocations.
- [ ] **Write replacement scripts** — update `deps:update` and `deps:dedupe`
      in root `package.json`. The new scripts should be self-documenting
      (the command should make obvious what it does without reading this PRD).
- [ ] **Remove `lerna-update-wizard`** from `devDependencies`.

## Notes

Branch: `feat/upgrades`

`ncu --workspaces` requires npm workspaces to be configured in root
`package.json` (`"workspaces": ["packages/*"]`). If this task lands before
the workspaces migration in TASK-036, `ncu` may need to fall back to
`lerna exec -- npx ncu` as an interim approach. Coordinate timing.

`syncpack` does not require workspaces — it just reads `package.json` files
directly. It can land before TASK-036.

b-ber uses fixed versioning (all packages share the same version number).
`syncpack fix-mismatches` defaults to pinning to the highest declared version.
Verify this behaviour is correct for a fixed-mode monorepo before running
`--write`.

Related: [[TASK-036]] (Lerna upgrade + workspaces migration)
