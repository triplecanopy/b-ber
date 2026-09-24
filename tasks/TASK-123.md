# TASK-123: Rewrite the Dependabot rules

**Epic:** Dependency health
**GitHub Issue:** #637 — https://github.com/triplecanopy/b-ber/issues/637
**Scope:** monorepo

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

### Settled 2026-09-23

- **`versioning-strategy: increase` is not in this config.** It bumps a range's
  lower bound, which means nothing against the `^` specifiers still in the tree. It
  lands with TASK-122 when specifiers are pinned exact. Dropping it is what
  un-blocks this task from TASK-122 — see Notes.
- **`open-pull-requests-limit` stays at 10.** Setting it to 0 would disable version
  updates entirely while keeping security PRs, which is tempting but lets everything
  rot. With majors ignored and the groups in place, 10 is not a constraint that will
  bind.
- **The `minor-patch` catch-all works.** PR #586 is a single grouped PR carrying 30
  updates, which is the catch-all doing its job. `patterns: ['*']` is now explicit
  rather than implied.
- **Dependabot is not erroring.** Its recent jobs all report `success`, and PRs
  already arrive scoped to `/packages/*` — it resolves the workspace manifests from
  the root lockfile on its own, so no per-directory entries are needed. The 37
  manifests are not causing timeouts.
- **GitHub Actions keeps its majors.** The major-ignore is scoped to the npm
  ecosystem only. Actions version their whole runtime in the major
  (`actions/checkout` v4 → v5 is the normal upgrade path) and Dependabot's advisory
  coverage for the ecosystem is thin, so ignoring majors there would freeze them on
  an old runtime with nothing to unfreeze them.
- **Group hygiene.** Dropped `eslint*`/`@eslint/*` (Biome replaced ESLint in
  TASK-015), `webpack*` (Vite, TASK-006/007) and `@reduxjs/*` (Redux removed in
  TASK-106) — none are declared anywhere any more. Added `@swc/*` (27 manifests)
  and `@testing-library/*` (1).

### Still to verify

**Does a security fix requiring a major still arrive?** This is the one rule that
could quietly reduce security coverage, and the sources disagree: GitHub's options
reference says `ignore` does not suppress security updates at all, while the
community write-up in the References warns that a bare `dependency-name` with no
`update-types` expands to `>= 0` and does suppress them. This config always carries
`update-types`, which should be the safe form — but it is worth confirming against a
real advisory rather than trusting either source.

## Subtasks

- [x] Add the rules above to `.github/dependabot.yml`
- [x] Verify the `minor-patch` catch-all group actually catches everything
- [ ] Test that a major-version *security* fix is not suppressed by the major ignore
- [x] Check Dependabot run logs for timeouts or manifest errors — clean
- [x] Decide on `open-pull-requests-limit` and record the reasoning — stays at 10
- [x] Split `security` / `dependencies` labels and confirm both exist

## References

- [Optimizing PR creation for version updates](https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/optimizing-pr-creation-version-updates)
  — grouping, limits, and scheduling
- [Customizing Dependabot security PRs](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/customizing-dependabot-security-prs)
  — which `dependabot.yml` keys leak into the security path
- [Ignoring a dependency without blocking security updates](https://pydevtools.com/handbook/how-to/how-to-ignore-a-dependency-in-dependabot-without-blocking-security-updates/)
  — the scoping trap this task must verify

## Notes

- **Re-sequenced 2026-09-23: this no longer waits on TASK-122.** The only rule that
  needed exact pins was `versioning-strategy: increase`, and it has been deferred to
  TASK-122 itself. The major-ignore works against caret ranges perfectly well — it
  concerns the update Dependabot proposes, not how the specifier is written. So the
  policy ships now and pinning is decided separately, on its own merits.
- Parent: TASK-121. Feeds TASK-124 — the backlog should be regenerated under these
  rules, not the old ones.
