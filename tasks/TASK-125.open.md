# TASK-125: Decide and document the transitive-vulnerability strategy

**Status:** not started
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** (pending)

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

- [ ] Confirm the parent-bump behaviour on a real alert in this repo
- [ ] Establish which current alerts have **no** parent fix available — those are
      the only genuine `overrides` candidates
- [ ] Write the decision order into AGENTS.md as a short runbook
- [ ] Define the comment + removal-condition convention for any override added
- [ ] Decide whether `overrides` entries get a periodic review, and where it lives

## Notes

- Monorepos with many manifests can hit Dependabot timeouts; this repo has 37
  workspace manifests. If transitive unlocking seems not to happen, check the
  Dependabot run logs before reaching for `overrides` — the feature may simply not
  have run.
- Parent: TASK-121. Independent of 122/123/124 and can proceed in parallel.
