# TASK-124: Automate merging and clear the backlog

**Status:** not started
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** high
**GitHub Issue:** (pending)

## Description

38 stale Dependabot PRs, each now needing to be up to date with `main` and
individually green against TASK-117's required `build-and-test` check
(`strict: true`).

### Do not grind through them

Rebasing and re-running CI 38 times, serially, for PRs that TASK-123's grouping
will collapse into a handful is wasted effort — and each merge invalidates the
"up to date" status of the other 37. **Reconfigure first (TASK-123), then close the
stale backlog and let Dependabot regenerate it under the new rules.** A handful of
grouped PRs against current `main` is cheaper to review and cheaper to merge than
38 individually rebased ones.

Exception: cherry-pick anything from the backlog that is independently valuable
before closing. Two are known:

- **#530 lerna 8 → 9** — removes the last `tar@6` path (TASK-120) *and* unblocks
  TASK-116 (OIDC needs lerna 9). Take this one deliberately, not as part of a group.
- **#531 `@types/node` 14 → 26** — the repo runs Node 24 against Node 14 types.

### Then automate the steady state

- **Auto-merge** for patch and minor: `dependabot/fetch-metadata` to read the
  update type, then `gh pr merge --auto --squash`. Auto-merge is only as safe as the
  gate, and the gate is now build + test + circular deps — adequate for patch/minor,
  not for majors (which TASK-123 ignores anyway).
- **Consider a merge queue.** With `strict: true`, a queue tests batches against
  current `main` and removes the serial rebase thrash entirely. It is the mechanism
  designed for this problem. Enabling it is a ruleset change (`merge_queue`), so it
  needs the same runbook treatment as TASK-117's required check.

## Subtasks

- [ ] Take #530 (lerna 9) on its own, with TASK-116 in mind
- [ ] Take #531 (`@types/node`) on its own
- [ ] Review the remaining backlog for anything else independently valuable
- [ ] Close the rest with a comment explaining the regeneration, so the history
      shows a decision rather than neglect
- [ ] Confirm Dependabot reopens a small set of grouped PRs under TASK-123's rules
- [ ] Add an auto-merge workflow scoped to patch/minor via `fetch-metadata`
- [ ] Evaluate the merge queue; if adopted, document the ruleset steps in AGENTS.md
      alongside the existing "Requiring the CI gate" runbook
- [ ] Re-measure the alert count and record it in TASK-120

## Notes

- Auto-merge with a weak gate is worse than no auto-merge. It is only defensible
  because TASK-117 made the gate required — do not enable it if that changes.
- Requires TASK-123 first, or the regenerated PRs arrive under the old rules.
- Parent: TASK-121.
