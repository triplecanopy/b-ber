# TASK-137: Run CI jobs based on what a pull request changes

**Epic:** Upgrade tooling
**GitHub Issue:** #697 — https://github.com/triplecanopy/b-ber/issues/697
**Scope:** monorepo

## Description

Every PR ran the full pipeline: `npm ci`, a build of all 37 packages, Jest, and
since TASK-130 the Playwright suites with a Chromium download. A PR that only
edits task PRDs (#690) paid for all of it, minutes of runner time to check
nothing that could have changed.

### The constraint that shapes the design

`build-and-test` is a **required check** in the "Base Rules" ruleset, with
"require branches to be up to date" on. The obvious tool, workflow-level
`on.pull_request.paths-ignore`, is unusable with that: a workflow that never
starts never reports its required check, and GitHub leaves the PR on "Expected —
waiting for status" forever. So the filtering has to be per job. A job skipped
by an `if:` condition reports **success**, which satisfies the required check.

## Design

`.github/workflows/ci.yml` gains a `changes` job. It lists the PR's files from
the GitHub API (`pulls/{n}/files`, renames under both names) and pipes them
through `scripts/ci-changes.js`, which puts each file in a tier. The PR takes the
highest tier any of its files reaches:

| Tier | Example files | `task-files` | `build-and-test` | `e2e` |
| ---- | ------------- | ------------ | ---------------- | ----- |
| **inert** | `docs/**`, `tasks/*.md`, `*.md` docs, PR/issue templates, `.claude/**`, `renovate.json5`, licences | ✅ | skip | skip |
| **unit** | `__tests__`/`__mocks__`/`__stubs__`, `jest.config.js`, `scripts/**`, `.github/scripts/**`, other workflows, `.circleci/**`, `.husky/**`, `biome.json`, `codecov.yml`, `tasks/EPICS.json` | ✅ | ✅ | skip |
| **full** | package `src/`, any `package.json`, `package-lock.json`, `lerna.json`, `tsconfig*`, `ci.yml`, `b-ber-testing` tests and fixtures, **anything unmatched** | ✅ | ✅ | ✅ |

Safety properties:

- **Unknown files are `full`.** A new kind of file costs a CI run rather than
  skipping one.
- **Markdown is not automatically inert.** The kitchen-sink fixture
  (`fixtures/kitchen-sink/_project/_markdown/`) and `demos/*/_project/` are
  Markdown the build renders. The first rule keeps `_project/` and `fixtures/`
  `full`, before the `*.md` rule can see them.
- **A failed classification runs everything.** The heavy jobs run when
  `needs.changes.result != 'success'`. An empty file list is also treated as
  `full`.
- **Pushes to `main` always run everything.**
- `task-files` runs `node scripts/check-tasks.js` on every PR. It uses Node
  built-ins only, so there is no `npm ci`. Docs-only PRs are mostly the ones
  that change task files, so this is the check they need.

## Dry run (2026-11-02)

The classifier, fed the files of the last 30 merged PRs plus the 8 open ones
through the same API call the workflow makes:

| Verdict | PRs |
| ------- | --- |
| **inert**: only `task-files` | #690, #689, #694, #611, #605, #590 |
| **unit**: no e2e | #597 (release-commit signing script) |
| **full** | the other 31, including every dependency PR (Renovate's and Dependabot's), every source change, and the release PRs |

Before: all 38 ran the full pipeline. Under the new rules, 6 docs-only PRs skip
both heavy jobs. The full dry-run output is reproducible with the loop in Notes.
Borderline `full` verdicts checked by hand:

- #613: `package.json` (correct: root scripts can change the build) and
  `codecov.yml`, which was then moved to `unit`.
- #641/#652: `.github/dependabot.yml`, which no longer exists. Left unmatched.

## Subtasks

- [x] `scripts/ci-changes.js`: tiers, highest-wins, unknown → `full`, empty →
      `full`, job summary
- [x] Unit tests: `scripts/__tests__/ci-changes.test.js` (39 cases, including the
      fixture-Markdown trap and unknown files)
- [x] `ci.yml`: `changes` job; `build-and-test` and `e2e` gated with fail-open
      `if:`; new `task-files` job
- [x] Dry run against the last 30 merged and the open PRs
- [x] AGENTS.md: how the scoping works, and the two rules for changing it
- [ ] Confirm on this PR (`full`, because it touches `ci.yml`): all jobs run
- [ ] Confirm on a docs-only PR: `build-and-test` shows "skipped" and the merge
      button is enabled

## Notes

- Reproduce the dry run:
  ```bash
  gh pr list --state merged --limit 30 --json number --jq '.[].number' | while read n; do
    echo "#$n $(gh api --paginate repos/triplecanopy/b-ber/pulls/$n/files \
      --jq '.[] | .filename, (.previous_filename // empty)' | node scripts/ci-changes.js)"
  done
  ```
- No third-party action (`dorny/paths-filter` and similar). A `gh api` call and
  a dependency-free script do the job, and the rules stay testable in Jest.
- `unit` runs the whole Jest suite, not just related tests. Narrowing Jest to the
  changed packages is possible (`--findRelatedTests`, or lerna `--since`), but
  the suite takes about 3s and build dominates. Not worth the risk of a missed
  test.
- Related: TASK-117 (made `build-and-test` required), TASK-130 (`e2e` job),
  TASK-118 (retire CircleCI, which has no such filtering).
