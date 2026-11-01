# TASK-132: Dependency update testing policy and impact analysis

**Epic:** Dependency health
**GitHub Issue:** #685 — https://github.com/triplecanopy/b-ber/issues/685
**Scope:** monorepo

## Description

With Renovate in place (TASK-129), routine minor and patch updates are covered by
CI. Majors are not, and that includes `[security]` PRs whose fix is a new major
(`markdown-it` 8 → 15, `js-yaml` 3 → 5, `image-size` 0.8 → 2, `postcss` 7 → 8).
Two things are missing:

1. **A written policy**: what automation does, what a person does, and how one
   informs the other. This is
   [`docs/dependency-update-policy.md`](../docs/dependency-update-policy.md).
2. **The automated half of it**: an impact report on each breaking-update PR
   telling the reviewer where the dependency is used and how far to trust the
   tests, plus a typecheck that ignores errors already on `main`.

### Feasibility, measured 2026-11-01

A prototype scan covering declaring packages, import sites, related Jest tests
and the internal packages reached took under a second for six dependencies. Repo
size is not the obstacle. The breaking-change surface is small:

| Dep | Import sites | Related Jest tests | …that mock the dep |
| --- | ------------ | ------------------ | ------------------ |
| markdown-it | 1 (`b-ber-markdown-renderer/src/index.ts`) | 8 | 0 |
| postcss | 1 (`b-ber-tasks/src/sass/index.ts`) | 1 | 0 |
| js-yaml | 1 (`b-ber-lib/src/YamlAdaptor.ts`) | 48 | 0 |
| image-size | 3 (grammar-image, tasks/cover, templates/figures) | 24 | **4** |

Two lessons for the design:

- **Import sites are the signal; "packages reached" is not.** `b-ber-tasks`
  depends on nearly everything, so almost every runtime dep reaches `b-ber-cli`.
  "Reached" only usefully separates the reader surface from the CLI surface.
- **Mocked tests have to be called out.** `image-size` is mocked in the main
  tests of both packages that import it, so Jest passes whatever image-size does.
  `jest --findRelatedTests` finds the tests; a check for `jest.mock('<dep>')`
  finds the ones that prove nothing.

## Design

A workflow, `dependency-impact.yml`, on pull requests that change any
`package.json`:

1. **Detect.** Diff each manifest against the base branch. Work only from the
   diff, not Renovate labels, so hand-made bumps are covered too. Act on a direct
   dep that crosses a major, or a minor below 1.0.0. Otherwise exit quietly.
2. **Report** (`scripts/dep-impact.js`). For each such dep:
   - import sites, with `file:line`, the imported symbols, and their call
     expressions;
   - related Jest tests, flagging any that mock the dep;
   - the surfaces reached (CLI, reader);
   - a checklist linking each call site to the reviewer's step in the policy.

   Posted as one sticky PR comment, updated in place on each push, and as the job
   summary.
3. **Typecheck diff.** `tsc --noEmit` per package on the base and the head.
   Report and fail on **new** errors only, normalised by file, error code and
   message, so the 123+ errors already on `main` (TASK-119) do not bury the
   signal. Retire this once TASK-119 makes plain typecheck green.
4. **Smoke.** Already done by the `e2e` job (TASK-130) on every PR, so nothing to
   add. The report links to its result.

The report never fails the PR on its own findings. It informs; the gate jobs
gate.

## Subtasks

- [x] Write `docs/dependency-update-policy.md`: roles, the four PR kinds, how the
      report maps to reviewer actions, manual runbook, current-state table
- [x] Link it from AGENTS.md "Dependency Updates"
- [ ] `scripts/dep-impact.js`: manifest diff → majors/0.x minors → import sites
      with symbols and call sites → related tests (+ mock flag) → surfaces → Markdown
- [ ] Unit tests for the detection rules (major, 0.x minor, range forms like
      `^`/`~`/exact, added and removed deps)
- [ ] `dependency-impact.yml`: run the script, post or update a sticky comment,
      write the job summary
- [ ] Typecheck diff (base vs head, new errors only) as a job in the same
      workflow
- [ ] Try it on the open security majors (`image-size` #679, `js-yaml` #680, and
      `markdown-it`/`postcss` when Renovate opens them) and refine the output
      against what a reviewer actually needed
- [ ] Update the policy's "What exists today" table as pieces land

## Notes

- The policy lands first, with a `Refs` PR. Until the workflow exists, its "Until
  TASK-132 lands" section gives the manual equivalent of the report's first
  section.
- Do not reach for a file-level import graph (`madge` across packages) until the
  import-site list has proven insufficient. Packages import siblings through
  their built `dist/`, which madge does not follow, and the import sites already
  point at the right files.
- `jest --findRelatedTests` follows source imports through the repo's
  `moduleNameMapper`. It found 48 related tests for `YamlAdaptor.ts`, so it does
  cross package boundaries here.
- Related: TASK-129 (Renovate), TASK-130 (e2e in CI; this builds on its job),
  TASK-131 (the reader navigation gap the policy works around), TASK-119
  (typecheck on `main`), TASK-124 (auto-merge; must exclude anything this
  workflow flags).
