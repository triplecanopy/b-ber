# TASK-138: Merge pull requests through a merge queue

**Epic:** Upgrade tooling
**GitHub Issue:** #701 — https://github.com/triplecanopy/b-ber/issues/701
**Scope:** monorepo

## Description

The "Base Rules" ruleset requires `build-and-test` with "require branches to be
up to date" on. That is the right guarantee (every merge was tested against the
`main` it lands on), but the only way to meet it is by hand, one PR at a time:
merge one, bring the next up to date, wait for CI, merge, repeat. Each merge
puts every other open PR behind again.

Renovate makes this obvious. On 2026-11-02 six dependency PRs needed merging,
and each one needed its own rebase, its own CI run and someone waiting on it.
CI is about 2½ minutes, so the waiting is not CI cost. It is the up-to-date
rule forcing the PRs through one at a time with a person at every step.

A [merge queue](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue)
keeps the guarantee and removes the loop. "Merge when ready" adds a PR to the
queue. GitHub builds each entry on top of `main` plus everything ahead of it,
runs the required checks against that, and merges in order. Nobody brings a
branch up to date by hand, for any PR, not only Renovate's. The repo is public
and owned by an org, so merge queues are available.

### Why not Renovate auto-rebase instead

`rebaseWhen: 'behind-base-branch'` would rebase every open Renovate PR after
each merge. It removes the step of ticking a checkbox but not the serial wait:
someone still merges one, waits for the next to rebase and pass, and merges
it. It also only helps Renovate's PRs.

## Design

### `ci.yml`

- **`merge_group:` trigger.** Without it the queue's `build-and-test` check
  never reports and every queued PR times out. This is why the ruleset switch
  comes **after** this merges, never before.
- **The `changes` job classifies a merge group by its diff.** A group has no PR
  file list, so the job fetches the group's `base_sha` and runs
  `node scripts/ci-changes.js --diff <base> <head>`, which lists the files with
  `git diff --no-renames` (a rename counts under both names, as it does for
  PRs). A docs-only PR in the queue then skips the heavy jobs, as it does on
  the PR itself. Classifying every queue run as `full` would bring back what
  TASK-137 removed, at the point where it blocks everything queued behind it.
- Fail-open is unchanged. If the fetch or diff fails, `changes` fails and
  `build-and-test` and `e2e` run anyway. An empty diff is `full`.
- Concurrency is unchanged. Queue refs (`gh-readonly-queue/main/pr-N-<sha>`)
  are unique per entry, and only `pull_request` runs cancel in progress, so the
  queue's runs are never cancelled by the workflow itself.

### Ruleset (after merge)

On "Base Rules" (18907410):

- Add the `merge_queue` rule: squash, matching how PRs have been merged.
  Grouping `ALLGREEN`.
- Turn off `strict_required_status_checks_policy`. The queue replaces "up to
  date": it tests each entry against the `main` it will land on. Leaving it on
  keeps the "out-of-date" block on the PR page for nothing.
- Keep `build-and-test` as the required check. It now reports from both
  `pull_request` and `merge_group` runs.

### Renovate

`rebaseWhen: 'conflicted'` stays. Being behind no longer blocks anything, so
there is nothing for an automatic rebase to fix. Only the comment explaining it
changes. Automerge for routine updates is deliberately out of scope; it would
be a separate policy decision.

## Subtasks

- [x] `scripts/ci-changes.js`: `--diff <base> <head>` lists files from git
- [x] Tests: `changedFilesBetween` against a temporary git repo (add, modify,
      delete, rename under both names)
- [x] `ci.yml`: `merge_group` trigger; `changes` classifies merge groups by
      their diff
- [x] `renovate.json5`: rewrite the `rebaseWhen` comment
- [x] AGENTS.md: merge queue workflow, ruleset steps, and the `renovate/**`
      force-push ruleset
- [ ] After merge: switch the ruleset (merge queue on, strict off)
- [ ] After the switch: queue a docs-only PR and a `full` PR and confirm each
      lands with the expected jobs

## Notes

- The `renovate/**` force-push ruleset (26425219) was set up on 2026-11-02,
  before this task, and is documented here because it is the other half of
  making dependency PRs move without hand-holding. The 2026-07-13 "Block
  force-push — all branches" ruleset blocked Renovate's rebases (a rebase is a
  force-push), so the checkbox did nothing. That ruleset now excludes
  `refs/heads/renovate/**`, and a second ruleset blocks force-pushes there
  with only the Renovate app (ID 2740) allowed to bypass.
- Each PR now runs CI twice, on the PR and in the queue. At about 2½ minutes on
  a public repo's free runners, that is cheap.
- Related: TASK-117 (made `build-and-test` required), TASK-137 (per-job
  scoping, which merge-group runs reuse), TASK-129 (Renovate).
