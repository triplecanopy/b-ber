# TASK-045: Refactor changelog generation and release workflow

**Status:** not started
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #513 — https://github.com/triplecanopy/b-ber/issues/513

## Description

The current changelog workflow is manual and fragile. `npm run changelog` runs
`conventional-changelog -p angular -i CHANGELOG.md -s -r 0` which rewrites the
single root-level `CHANGELOG.md` from scratch. The full release sequence —
build, version bump, changelog update, publish — must happen in a specific
order with no automation to enforce it or catch sequencing errors.

Problems with the current setup:

- **Single file, no per-package granularity.** All packages share one
  `CHANGELOG.md` at the root. Since Lerna uses a fixed version (`3.1.0`
  for all packages), readers can't tell which package a change affected.
- **Manual sequencing.** There is no script or workflow that runs the release
  steps in order. A missed step silently produces an inconsistent release.
- **No draft / review step.** The changelog is generated and immediately
  committed; there is no opportunity to review or edit entries before they
  land on `main`.
- **Stale format.** The angular preset produces `Bug Fixes` / `Features`
  sections from conventional commit types, but the entries are one-liners
  with no context — not useful for consumers reading the changelog.

### Desired end state

A changelog process that:

1. Runs without a required mental model of step order
2. Produces entries that are readable by a human who hasn't seen the commits
3. Has a review/edit step before entries are committed
4. Works with the existing conventional commit format already in use

### Options to evaluate

| Approach           | Notes                                                                               |
| ------------------ | ----------------------------------------------------------------------------------- |
| `changesets`       | Monorepo-native; contributors add a changeset file per PR; tool assembles CHANGELOG |
| `release-please`   | Google's tool; opens a release PR automatically; works with conventional commits    |
| `semantic-release` | Fully automated tag + publish; complex config; CI-only                              |
| AI-assisted        | Agent reads commit range, writes human-readable summaries, opens a draft PR         |
| Keep current       | Fix the sequencing with a release script; improve the template                      |

The "agentic" option — running an agent over the commit range to produce
prose summaries — is worth evaluating. The agent would read `git log` since
the last tag, group commits by type and scope, draft a CHANGELOG entry in
markdown, and open a PR for review. This is the most work to build but
produces the highest-quality output.

`changesets` is the lightest-weight tool option. It adds per-PR changeset
files that are later assembled into a CHANGELOG, gives contributors a natural
review moment, and has good Lerna integration.

`release-please` is the best fit if the team wants full automation with
minimal overhead — it reads conventional commits and opens a release PR on
every push to `main`.

## Subtasks

- [ ] Audit the current release workflow end-to-end; document the exact steps
      required today and where errors have occurred
- [ ] Evaluate changesets vs release-please vs AI-assisted approach
- [ ] Prototype the chosen approach on a branch
- [ ] Update root `package.json` scripts to reflect new workflow
- [ ] Document the new release process in AGENTS.md or a dedicated RELEASING.md
- [ ] Test a full cycle: bump version, generate changelog, publish dry-run

## Notes

Branch: `feat/upgrades` (research); implementation on a dedicated branch.

The "agentic" release workflow would work as follows:

1. Agent is invoked with a commit range (e.g. `v3.1.0..HEAD`)
2. Agent reads each commit, groups by scope (package), identifies breaking
   changes and notable features
3. Agent drafts a changelog entry in a human-readable format (prose + bullets)
4. Agent opens a draft PR with the changelog update + version bump for review

This could be implemented as a Claude Code slash command or a GitHub Actions
workflow that calls the Anthropic API. The main tradeoff: the output requires
human review before merging, but produces far better changelog entries than
`conventional-changelog` does mechanically.

Related: [[TASK-036]] (Lerna upgrade — version and publish commands change in v7+)
