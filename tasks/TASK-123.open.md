# TASK-123: Rewrite the Dependabot rules

**Status:** not started
**Feature:** Dependency health
**Scope:** monorepo
**Priority:** high
**GitHub Issue:** (pending)

## Description

Make Dependabot surface only what is worth a human's attention. The existing config
(TASK-037) has sensible grouping but no version-policy rules, and labels everything
`security` including plain version bumps.

### Rules to add

| Rule | Why |
| ---- | --- |
| `ignore: update-types: ["version-update:semver-major"]` | The "no majors" rule the user asked for. **Must be scoped this way** — an `ignore` naming only a dependency expands to `>= 0` and suppresses its *security* updates too |
| `versioning-strategy: increase` | With exact pins (TASK-122), bump the pin rather than widening the range |
| `rebase-strategy: disabled` | Dependabot auto-rebases open PRs when `main` moves. With TASK-117's gate required and `strict: true`, that means a CI storm on every merge. Rebase deliberately instead |
| `commit-message: {prefix: "chore(deps)", include: "scope"}` | commitlint enforces conventional commits; make Dependabot comply by construction |
| `labels: ["dependencies"]` | Stop labelling version bumps `security`. Reserve `security` for actual alerts so the label is usable for triage |
| `schedule: {interval: weekly, day: monday}` | Batch arrivals into one predictable window |
| `groups` | Keep the existing groups; **verify the `minor-patch` catch-all works** — it declares `update-types` with no `patterns`, which needs confirming |

### Open questions to settle

- **Does a security fix requiring a major still arrive** once majors are ignored for
  version updates? Test it rather than assume; this is the one rule that could
  silently reduce security coverage.
- **Should `open-pull-requests-limit` go to 0?** That disables version updates
  entirely while keeping security PRs — attractive if the team only wants to act on
  vulnerabilities, but it stops routine maintenance and lets versions rot. Decide
  explicitly rather than by default.
- **Are there Dependabot run errors?** Monorepos with many manifests can time out,
  and this repo has 37. Check the Dependabot logs for failures — coverage gaps would
  explain why some packages never get PRs.

## Subtasks

- [ ] Add the rules above to `.github/dependabot.yml`
- [ ] Verify the `minor-patch` catch-all group actually catches everything
- [ ] Test that a major-version *security* fix is not suppressed by the major ignore
- [ ] Check Dependabot run logs for timeouts or manifest errors
- [ ] Decide on `open-pull-requests-limit` and record the reasoning
- [ ] Split `security` / `dependencies` labels and confirm both exist

## References

- [Optimizing PR creation for version updates](https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/optimizing-pr-creation-version-updates)
  — grouping, limits, and scheduling
- [Customizing Dependabot security PRs](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/customizing-dependabot-security-prs)
  — which `dependabot.yml` keys leak into the security path
- [Ignoring a dependency without blocking security updates](https://pydevtools.com/handbook/how-to/how-to-ignore-a-dependency-in-dependabot-without-blocking-security-updates/)
  — the scoping trap this task must verify

## Notes

- Requires TASK-122 first: `versioning-strategy: increase` is meaningless against
  caret ranges.
- Parent: TASK-121. Feeds TASK-124 — the backlog should be regenerated under these
  rules, not the old ones.
