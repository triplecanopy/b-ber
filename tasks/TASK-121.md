# TASK-121: Put Dependabot on a working footing (parent)

**Epic:** Dependency health
**GitHub Issue:** #610 — https://github.com/triplecanopy/b-ber/issues/610
**Scope:** monorepo

## Goal

Dependabot is worth keeping, but it currently produces more noise than signal: 422
open alerts and 38 open PRs, the oldest two months old, none of which anyone can
merge cheaply. Make it a tool that works — pinned and deduped inputs, rules that
only surface what is worth looking at, an automated path to merge, and a documented
answer for transitive vulnerabilities.

This is the **process** parent. The actual vulnerability remediation lives in
TASK-120, which continues independently.

## Sub-tasks

- [ ] TASK-122: Pin and dedupe every dependency specifier
- [ ] TASK-123: Rewrite the Dependabot rules
- [ ] TASK-124: Automate merging and clear the backlog
- [ ] TASK-125: Decide and document the transitive-vulnerability strategy

**Order matters.** 122 → 123 → 124. Pinning first, because the rules' behaviour
depends on specifiers (`versioning-strategy` is meaningless against `^` ranges).
Rules second, because the backlog should be regenerated *under the new rules*
rather than cleared under the old ones. 125 is independent and can run in parallel.

---

## Current state (measured 2026-09-22)

| | |
| --- | --- |
| Open alerts | 422 — 23 critical, 255 high, 131 medium, 13 low |
| Open Dependabot PRs | 38, oldest 2026-07-17 |
| Specifier styles | **388 `^`**, 3 other, 1 exact |
| Deps with conflicting specs across packages | **3** |
| `overrides` in root `package.json` | none |
| `syncpack` | already a devDependency (TASK-053) |

The three conflicts are the whole dedupe problem:

| Dep | Specs in use |
| --- | --- |
| `js-yaml` | `^3.12.0`, `^4.1.0` |
| `@types/js-yaml` | `^3.12.10`, `^4.0.9` |
| `sass` | `^1.49.8`, `^1.70.0` |

So the user's instinct was right — packages are already near-deduped, and pinning
is not the upheaval it sounds like. `js-yaml` 3 → 4 is the only real decision (it
dropped `safeLoad`).

## Why 38 PRs exist against a limit of 10

`open-pull-requests-limit: 10` is set, and **security updates do not count against
it**. Version updates are capped; security updates are not. That is the whole
explanation, and it means the limit cannot be used to control the backlog size.

Two levers follow from this:

- `open-pull-requests-limit: 0` disables **version**-update PRs while leaving
  security PRs flowing — a way to go security-only without disabling Dependabot.
- **An `ignore` entry naming only a dependency expands to `>= 0` and applies to the
  security path as well as the version path.** So a naive "ignore majors" rule can
  silently suppress security fixes. Ignores must be scoped with
  `update-types: ["version-update:semver-major"]`, and TASK-123 must verify in
  practice that a security fix requiring a major still comes through.

## Transitive dependencies: the default is not `overrides`

Since September 2022 Dependabot **unlocks npm transitive dependencies**: when a
parent constrains a child to a vulnerable range, it will raise a PR bumping the
*parent* so the fixed child can be used. So the strategy is:

1. Let Dependabot bump the parent. This is the default and needs no configuration.
2. Use npm `overrides` only when **no parent update exists**.
3. Treat every override as tech debt with a removal condition.

`npm audit fix` is not a strategy — it cannot fix anything needing a major bump,
and `--force` makes changes nobody reviewed.

Worth knowing: monorepos with many manifests can hit **Dependabot timeouts**. With
37 workspace manifests this repo is in that territory, and it may explain gaps in
coverage. TASK-123 should check for `dependabot` run errors in the repo's
Dependabot logs.

## References

- [Dependabot security updates](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependabot-security-updates)
  — security vs version updates, and why `open-pull-requests-limit` does not bound the backlog
- [Ignoring a dependency without blocking security updates](https://pydevtools.com/handbook/how-to/how-to-ignore-a-dependency-in-dependabot-without-blocking-security-updates/)
  — the `>= 0` expansion that makes a naive major-ignore suppress security fixes
- [Dependabot unlocks transitive dependencies for npm](https://github.blog/changelog/2022-09-07-dependabot-unlocks-transitive-dependencies-for-npm-projects/)
  — why `overrides` is the fallback rather than the strategy

## Notes

- **Do not run CI across all 38 existing PRs.** With TASK-117's gate now required
  and `strict: true`, each needs to be up to date and individually green — 38 serial
  rebase-and-rerun cycles for PRs that the new grouping rules will collapse into a
  handful anyway. Reconfigure, then regenerate. That is TASK-124's core argument.
- The current config labels **every** PR `security`, including plain version bumps.
  That makes the label useless for triage; TASK-123 should split it.
- TASK-120 already demonstrated the highest-value move Dependabot cannot suggest:
  **deleting an unused dependency**. `tar` was 59% of the alerts and was imported
  nowhere. Any bump should be preceded by "is this even used?".
- Related: TASK-120 (the vulnerability remediation this supports), TASK-037
  (configured the current grouping), TASK-117 (the gate these PRs must now pass),
  TASK-116 (needs lerna 9, which is also in the backlog), TASK-053 (added
  `syncpack`).
