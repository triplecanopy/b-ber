# TASK-117: Gate pull requests on CI

**Status:** in progress
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** high
**GitHub Issue:** (pending)

## Description

**No pull request in this repository is gated on CI.** Verified 2026-09-22:

```
ruleset "Base Rules" rules:  deletion, non_fast_forward, required_signatures, pull_request
                                                 ↑ no required_status_checks

commit statuses on main's last 5 commits:  0, 0, 0, 0, 0
check runs on main HEAD:                   Dependabot, publish   (nothing from CircleCI)
checks on PRs #594 / #597 / #598 / #599:   "no checks reported"
```

`.circleci/config.yml` says "No branch filters: build + e2e run on every push and
pull request", but CircleCI reports **no statuses and no check runs** to GitHub —
not on PRs, not on `main`. And even if it did, the ruleset has no
`required_status_checks` rule, so a red build would not block a merge.

This is how the 4.0.3 release went wrong. `release-prepare.yml` runs build and
test **before** the version bump, so a failure the bump itself causes cannot be
caught there — and it wasn't: the release PR (#598) merged a bump whose
`package.json` formatting broke `biome check`, `release-publish.yml` then failed at
`npm test` on `main`, and the release stalled with `main` red. A CI gate on the
release PR would have caught it pre-merge.

It would also have caught the earlier `uglifyjs` failure (TASK-115), which only
appeared once the build ran in a hoisted install.

### Side effect worth knowing

A version bump that cannot publish leaves a commit titled e.g. `4.0.3` on `main`
that is *not* the released commit — the release actually ships from whatever later
push triggers a successful publish. The `v4.0.3` tag is correct (it points at the
commit that was built and published), so this is a legibility problem rather than a
correctness one. Gating the release PR removes it: a bump that cannot publish never
reaches `main`.

## Chosen approach

`.github/workflows/ci.yml` — a `build-and-test` job on `pull_request` and on
pushes to `main`, running `npm ci --ignore-scripts` → `npm run build` → `npm test`.
That is deliberately the same sequence `release-publish.yml` runs, so a green PR
means the publish step will get that far too.

GitHub Actions rather than repairing CircleCI's reporting: the release workflows
already live in Actions, and a gate that reports to GitHub natively is the point.
Whether CircleCI should keep running build/test at all — or be retired now that
Actions covers it — is left open below.

**The workflow alone blocks nothing.** It has to be added as a required status
check on `main`, which is a repository-settings change (see the runbook in
AGENTS.md § Releases → "Requiring the CI gate").

## Subtasks

- [x] Establish that no PR is currently gated (statuses, check runs, ruleset rules)
- [x] Add `.github/workflows/ci.yml` with a `build-and-test` job
- [x] Document the ruleset procedure so the check is actually enforced
- [ ] Merge, and confirm the check appears and runs on a PR
- [ ] Add `build-and-test` as a required status check on `main` in the ruleset
- [ ] Verify enforcement: open a PR with a deliberate lint error and confirm it
      cannot be merged
- [ ] Decide CircleCI's future: fix its GitHub reporting, narrow it to the e2e job
      only, or retire it (its `build` job now duplicates this workflow)
- [ ] Consider adding `npm run typecheck` and `npm run check:circular` to the gate.
      TASK-022 made the circular-dependency check an "enforcing CI gate", which is
      only true if something enforces it

## Notes

- **Ordering matters.** GitHub only offers a status check in the ruleset UI once it
  has reported at least once, so the workflow must merge and run before it can be
  required. Until then the gate is advisory.
- The `concurrency` group cancels superseded PR runs but not `main` runs, where
  each commit's result is worth keeping.
- Raised while explaining why the 4.0.3 release commit is not the commit that
  shipped. Related: TASK-115 (the release pipeline), TASK-045 (release/changelog
  refinement), TASK-022 (the circular-dependency gate), TASK-035 (CircleCI
  modernization — whose PR validation this supersedes if CircleCI is retired).
