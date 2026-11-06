# TASK-125: Decide and document the transitive-vulnerability strategy

**Epic:** Dependency health
**GitHub Issue:** #639 — https://github.com/triplecanopy/b-ber/issues/639
**Scope:** monorepo

## Description

Most of the 422 alerts are transitive, and there is currently no written answer for
how to handle a vulnerability in a dependency we do not declare. Settle one and
write it into AGENTS.md.

### The default is not `overrides`

Since September 2022 Dependabot **unlocks npm transitive dependencies**: when a
parent constrains a child to a vulnerable range, it raises a PR bumping the *parent*
so the fixed child can be used. So the order of preference is:

1. **Let Dependabot bump the parent.** Default, no configuration needed.
2. **`overrides` in the root `package.json`** — only when no parent update exists.
   npm 8+; the root has none today.
3. **Remove the dependency.** TASK-120 showed this is sometimes the real answer —
   `tar` was 59% of the alerts and imported nowhere.

`npm audit fix` is not on the list: it cannot fix anything requiring a major, and
`--force` makes unreviewed changes.

### Overrides are invisible tech debt

An override silently pins a transitive version for the whole tree, including for
consumers of the published packages. Anything added needs:

- a comment saying which advisory it addresses and which parent is the real blocker
- a removal condition, so it is not load-bearing forever
- a check that it does not contradict a parent's peer requirement

Worth deciding whether overrides should be reviewed periodically, and if so, where
that is recorded.

## Subtasks

- [x] Confirm the parent-bump behaviour on a real alert in this repo — moot:
      Renovate has no transitive remediation (TASK-129), so this behaviour
      left with Dependabot
- [x] Establish which current alerts have **no** parent fix available — those are
      the only genuine `overrides` candidates
- [x] Write the decision order into AGENTS.md as a short runbook
- [x] Define the comment + removal-condition convention for any override added
- [x] Decide whether `overrides` entries get a periodic review, and where it lives

## References

- [Unlocking security updates for transitive dependencies with npm](https://github.blog/security/supply-chain-security/unlocking-security-updates-for-transitive-dependencies-with-npm/)
  — the parent-bump behaviour this task depends on
- [Dependabot errors](https://docs.github.com/en/code-security/reference/supply-chain-security/troubleshoot-dependabot/dependabot-errors)
  — manifest-count timeouts, relevant with 37 workspaces

## Notes

- Monorepos with many manifests can hit Dependabot timeouts; this repo has 37
  workspace manifests. If transitive unlocking seems not to happen, check the
  Dependabot run logs before reaching for `overrides` — the feature may simply not
  have run.
- Parent: TASK-121. Independent of 122/123/124 and can proceed in parallel.

## Closed 2026-11-06

The answer changed with the tool. This task assumed Dependabot, which bumps a
parent so that a fixed child can be used. Renovate, which replaced it in
TASK-129, cannot target a transitive dependency at all. The decision order is
now in AGENTS.md under "Transitive vulnerabilities":

1. remove the parent if it is vestigial;
2. the weekly lockfile PR, or `npm update <pkg>` in a task PR;
3. a major on the direct dependency, as a task;
4. `overrides` as the last resort.

The same section defines the `overrides` convention: a `//overrides` note naming
the advisory and the blocking parent, a removal condition, and a check against
the parent's peer dependencies. It also says where entries get reviewed: in the
weekly lockfile PR, and whenever their parent changes, with no separate
schedule.

**No alert needs an override today.** Of the 74 packages npm audit flags, 52
have a fix within their parents' ranges, which the lockfile PR covers. The
other 22 need a major on a direct dependency: `axios` via `browser-sync`, the
`commitlint`, `conventional-changelog-cli` and `pureimage` trees, and
`markdown-it` (#699). None has no fix path. The one place no parent release
accepts the fix is lerna's exact `js-yaml@4.3.0` pin. It is a dev-only copy that
parses our own config, so it was left alone rather than overridden (TASK-140).
