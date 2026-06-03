# TASK-052: Research Verdaccio workflow for testing lerna publish

**Status:** not started
**Scope:** monorepo
**Priority:** medium

## Description

`lerna publish --dry-run` does not exist in any version of Lerna. Before
landing the Lerna v8 upgrade (TASK-036), we need a reliable way to test the
publish pipeline — especially the canary workflow — without touching the real
npm registry.

The leading candidate is Verdaccio, a lightweight local npm proxy/registry that
can stand in for npm during local and CI testing. This task is to research and
document the exact workflow so it can be used by anyone cutting a release.

The canary publish command in question:
```sh
lerna publish --canary --preid <name> --dist-tag <name> --force-publish="*"
```

And the simultaneous full publish:
```sh
lerna publish --force-publish="*"
```

## Subtasks

- [ ] **Confirm Verdaccio works with scoped packages** — b-ber packages are all
      scoped under `@canopycanopycanopy`. Verify that Verdaccio handles scoped
      package auth correctly and that the `--registry` flag is sufficient, or
      whether `.npmrc` scope overrides are needed.
- [ ] **Determine auth requirements** — `npm adduser` creates a local user.
      Verify this works without a real npm token, and that `lerna publish` does
      not attempt to verify access against the real registry when `--registry`
      is set.
- [ ] **Map out the full canary test run** — step-by-step from starting
      Verdaccio through publishing, viewing the published packages, and
      optionally installing from the local registry.
- [ ] **Check whether git tagging is skipped or real** — Lerna creates git tags
      during publish. Determine whether a test run would pollute local git
      history and whether `--no-git-tag-version` or `--no-push` should be
      added to the test command.
- [ ] **Evaluate for CI use** — could a Verdaccio instance be used in CircleCI
      (TASK-035) to gate publish-path changes? What would that step look like?
- [ ] **Document the final workflow** — write the complete command sequence
      into TASK-036's Notes or a `docs/` file so it is repeatable by anyone
      on the team.

## Notes

Branch: `feat/upgrades`

Verdaccio stores published packages in `~/.config/verdaccio/storage` by
default. Deleting that directory between test runs gives a clean slate.

Verdaccio proxies unknown packages to the real npm registry, so it functions
as a full registry replacement — packages b-ber depends on can still resolve.

The git-tag question is important: if `lerna publish` creates tags during
a test run they will need to be deleted before the real publish. Consider
`--no-git-tag-version --no-push` as standard flags for the test command, and
document why they are included.

Related: [[TASK-036]] (Lerna upgrade), [[TASK-035]] (CircleCI)
