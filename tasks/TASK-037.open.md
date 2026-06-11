# TASK-037: Replace or reconfigure automated dependency management

**Status:** not started
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #492 — https://github.com/triplecanopy/b-ber/issues/492

## Description

Dependabot is currently configured in `.github/dependabot.yml` but is
effectively non-functional and paused on GitHub. The configuration has
several problems:

1. **Wrong target branch** — `target-branch: 'develop'` but this branch does
   not exist. PRs would target a nonexistent branch.
2. **Version updates disabled** — `open-pull-requests-limit: 0` suppresses all
   version-bump PRs. Only security alerts would fire, and even those would
   fail due to the wrong target branch.
3. **No grouping** — in a 30-package monorepo, a single transitive dependency
   bump can produce dozens of PRs simultaneously. There is no grouping strategy.
4. **No auto-merge** — no workflow to automatically merge passing security PRs,
   so they pile up unreviewed.
5. **Signal-to-noise ratio** — the existing open issues include old Dependabot
   noise that was never triaged.

Since Dependabot is paused and the config is broken, this is an opportunity
to decide on the right approach for the modernized stack rather than just
patching the existing config.

## Options

**Option A — Remove Dependabot, rely on `npm audit` in CI**
Dependabot is deleted. `npm audit --audit-level=high` runs in CI (TASK-035)
on every push. Security vulnerabilities surface as CI failures rather than PRs.
No automated version updates; dependency bumps happen manually or in dedicated
maintenance sprints.

Pros: no PR noise, clear failure signal, no branch targeting issues.
Cons: no automated version update PRs; `npm audit` only catches known CVEs,
not outdated-but-not-vulnerable packages.

**Option B — Reconfigure Dependabot with grouping and auto-merge**
Fix the target branch (`feat/upgrades`), enable version updates with a
weekly schedule, add grouping rules (e.g. all `@babel/*`, all `@swc/*`, all
`@types/*` in one PR each), and add a GitHub Actions workflow to auto-merge
patch PRs that pass CI. Limit to `open-pull-requests-limit: 5`.

Pros: automated updates with manageable PR volume.
Cons: still requires CI to be green (TASK-035 must land first); 30 packages
means grouping config is non-trivial.

**Option C — Replace with Renovate Bot**
Renovate is more configurable than Dependabot: richer grouping rules,
semantic versioning awareness, monorepo support, auto-merge policies, and a
dashboard issue for visibility. Configured via `renovate.json` in the repo root.

Pros: best-in-class configuration; handles monorepos well.
Cons: new tool to learn; requires a GitHub App install or self-hosting.

**Option D — Agentic periodic audit**
Remove Dependabot. Use a Claude Code scheduled task (or a simple cron-based
GitHub Actions workflow) to run `npm outdated` + `npm audit` monthly, open a
single consolidating issue with a full report, and let a human or AI agent
decide what to upgrade. This aligns with the project's direction toward agentic
tooling.

Pros: human-readable summary, no PR noise, flexible.
Cons: not fully automated; requires someone to act on the report.

## Subtasks

- [ ] **Audit existing Dependabot PRs / alerts** on GitHub; close or dismiss
      any stale ones before making changes.
- [ ] **Decide on approach** (Options A–D above, or hybrid).
- [ ] **Implement chosen option**: - A: delete `.github/dependabot.yml`, add `npm audit` step to CI - B: rewrite `.github/dependabot.yml` with correct branch + grouping +
      auto-merge workflow - C: replace with `renovate.json`; install Renovate GitHub App - D: delete `.github/dependabot.yml`; add a monthly `npm-audit.yml`
      GitHub Actions workflow that opens a consolidated issue
- [ ] **Document the chosen approach** in root `AGENTS.md` under a new
      "Dependency Management" section.

## Notes

Branch: `feat/upgrades`

**Recommendation:** Option A or D. The project is mid-migration; the stack is
intentionally in flux and automated version-bump PRs will mostly fail CI until
the migration completes. A clean `npm audit` gate in CI (Option A) gives
security coverage with zero noise. Revisit automated version updates (Option B
or C) once the TS/Vite/Biome migration is complete and CI is green.

**Prerequisite:** TASK-035 (CircleCI fix) should land before Option A/B/D is
implemented, since the audit gate belongs in CI.

Related: [[TASK-035]] (CircleCI — home for `npm audit` gate)
