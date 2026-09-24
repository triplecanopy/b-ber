# TASK-126: Replace PLAN.md with an epic → task hierarchy

**Epic:** Upgrade tooling
**GitHub Issue:** #612 — https://github.com/triplecanopy/b-ber/issues/612
**Scope:** monorepo

## Decision (2026-09-23) — executed the same day

**Option A: GitHub sub-issues + issue types for the hierarchy, task PRD files for
the content.** Migrated 2026-09-23.

### What was settled

`epic` and `feature` were used interchangeably; the word **feature** is retired.
The hierarchy is **`epic ← task`**, with a third level only where a parent task
genuinely has children (TASK-122–125 under TASK-121). A uniform three-level tree
was rejected: only 2 of 36 open tasks had real children, so a middle layer would
have meant inventing ~15 issues representing no work.

The seven features became seven epics, plus an eighth — **EPUB spec compliance** —
for the five 2026-07-22 validation issues (#541–545) that predated the task system
and had no PRDs, which is most of why they went quiet.

### What shipped

| | |
| --- | --- |
| Epics | 8 — five new (#615–619), three converted from umbrella tasks (#471, #474, #505) |
| Task issues created | 20 (#620–639) |
| Issues re-parented | 18 |
| Issues typed | 46 |
| Project board | [orgs/triplecanopy/projects/3](https://github.com/orgs/triplecanopy/projects/3), with `Status` and `Priority` |
| `PLAN.md` | deleted; its live sequencing moved into the epic bodies |

### Field changes

`**Feature:**` → `**Epic:**`. `**Status:**` and `**Priority:**` removed — status
is the issue being open or closed, priority is a board field. The `.open` filename
suffix is gone: one file per task, `tasks/TASK-NNN.md`, open or closed alike.

That leaves the epic assignment as the **only** fact stored twice (file field +
issue parent), which `scripts/check-tasks.js` reconciles.

### Two bugs the migration surfaced

- **#604 (TASK-118) had been closed in error.** PR #605 *filed* the PRD and said
  `Closes #604`, closing a task nobody had started. `.circleci/config.yml` was
  still in the tree. Reopened. #591 had been hit by the identical mistake earlier.
  `AGENTS.md` now says only the PR that does the work may say `Closes`.
- **#600 (TASK-117) was genuinely done** — `ci.yml` exists and `build-and-test` is
  a required check — while its task file still read `in progress`. One day of
  drift, in exactly the field this migration removed.

### Deferred

Nine pre-2020 issues (#10, #207, #208, #216, #220, #223, #228, #230, #327) are
open and unparented, awaiting a separate triage pass. They are deliberately not in
the tree.

Option B (a generated in-repo registry) remains the documented fallback and is
complementary — a generated offline view could be added later without undoing this.
Option C (a hand-written registry file) was rejected: it reproduces the defect
below.

## Description

`PLAN.md` has outgrown its purpose. It was written to drag a stale repo back into a
known state after a long gap — a one-off catch-up document — and it is now being
used as a permanent tracker it was never shaped for: **564 lines, 13 top-level
sections**, covering 35 open and 90 closed tasks.

### The real problem is not the format

`PLAN.md` is **hand-maintained derived data.** Every count, status, and table in it
is duplicated from the task files, and has to be updated by hand on every change.
That guarantees drift. Evidence already in the tree:

- `TASK-004` carries `**Feature:** Unit test coverage (epic)` — a value that matches
  no other task and no declared feature, sitting alongside two tasks that use
  `Unit test coverage`.
- The `Done / Active / Backlog` counts per feature are maintained manually and have
  been edited several times per session during recent work.
- `PLAN.md` and `AGENTS.md` both enumerated "six features" and both had to be
  corrected when a seventh was added (2026-09-22).

**So the replacement must not be another hand-maintained index**, or it inherits the
same failure. `epic-NNN.md` files with a hand-written registry would drift exactly
the way `PLAN.md` drifts. Whatever replaces it should either maintain itself or be
generated.

### Terminology to settle first

"Epic" is currently overloaded. `AGENTS.md` calls the seven features "features
(epics)" and uses the words interchangeably; the desired model is a real
three-level hierarchy:

```
epic  ←  feature  ←  task
```

That needs deciding and writing down before any migration, because it determines
what the seven current "features" become — epics, or features under a smaller number
of epics.

## GitHub can do this natively (checked 2026-09-22)

This was worth checking rather than assuming, and the answer changes the
recommendation. **Sub-issues and issue types are generally available**, and GitHub's
own documented hierarchy is `Project → Epic → Feature → Story`, connected as
sub-issues.

Verified against this repo:

| | Finding |
| --- | --- |
| Org issue types configured | **`Task`, `Bug`, `Feature`** already exist on `triplecanopy` |
| `Epic` type | not yet created — would need adding |
| Sub-issues API | **works** — `GET repos/triplecanopy/b-ber/issues/610/sub_issues` returns cleanly |
| Hierarchy view in Projects | public preview |
| Constraint | **an issue can have only one parent**, so a task cannot belong to two epics |

The one-parent constraint is worth noting but not a blocker: the desired model is a
strict tree anyway.

## Options

**A. GitHub sub-issues + issue types for hierarchy; files for content.** ✅ **CHOSEN 2026-09-23**
Task PRDs stay in `tasks/` — versioned with the code, reviewable in a PR, readable
offline. GitHub holds the *relationships* and provides the registry view, and
maintains them itself. Retires `PLAN.md` without replacing it with something that
drifts.
Cost: the hierarchy is only visible online, and it depends on issues existing for
tasks — `AGENTS.md` currently says issues mirror **only** the active working set, so
that policy has to change or the hierarchy will have holes.

**B. Generated in-repo registry.** A script reads the `**Feature:**` / `**Status:**`
frontmatter from every `tasks/*.md` and emits the index. Keeps everything in-repo
and offline, and removes drift by construction rather than by discipline.
Cost: a script to maintain, and it needs a CI check or it silently goes stale like
`PLAN.md` did.

**C. Hand-written `epic-NNN.md` + registry file.** The original suggestion.
Simple and needs no tooling, but reproduces `PLAN.md`'s actual defect — a
hand-maintained index of data that lives elsewhere.

**A is the decision.** B remains the documented fallback if GitHub's hierarchy does
not fit in practice, and the two are complementary — a generated offline view could
be added later without undoing A. C is rejected: it reproduces the defect above.

## Subtasks

- [x] Settle the `epic ← feature ← task` definitions — resolved to `epic ← task`;
      "feature" retired
- [x] Decide between options A / B / C — **A chosen 2026-09-23**
- [x] Create an `Epic` issue type on the org
- [x] Decide whether every task gets an issue — **yes**; the "active working set
      only" policy is replaced
- [x] Extract everything still live from `PLAN.md` into the epic bodies: the
      Dependency health ordering and its reasons, the React 19 five-step plan and
      deferred bug cluster, the cross-epic edges (TASK-050 → TASK-046,
      TASK-122's lerna 9 → TASK-116)
- [x] Fix `TASK-004`'s stray `Unit test coverage (epic)` value — moot; TASK-004
      was promoted to epic #471 and the file retired to historical record
- [x] Build the registry — `tasks/EPICS.json`, which the check reads
- [x] Add a CI check that every task's `**Epic:**` is one of the declared values —
      `scripts/check-tasks.js`, in `npm test`; `--remote` also reconciles titles
      and parents, daily via `.github/workflows/task-hierarchy.yml`
- [x] Retire `PLAN.md` — deleted; references updated in `AGENTS.md`,
      `codecov.yml`, `b-ber-reader-react/{AGENTS,MIGRATION-CONVENTIONS,SPREAD-CLUSTER-QA}.md`,
      both skills, and the stale bookkeeping subtasks in 14 open task files
- [x] Update `AGENTS.md`'s "Start here" instruction

## Notes

- **The sequencing was extracted before `PLAN.md` was deleted.** Its per-epic
  sections held ordering and rationale that existed nowhere else — why TASK-122 must
  precede 123 and 123 must precede 124, and the React 19 five-step plan. All of it
  is now in the corresponding epic bodies (#618 and #617).
- The 90 closed task files are the archive and should stay as they are. Only open
  work needs migrating.
- Worth considering whether the seven current features are really *epics* or whether
  they are features under two or three epics (e.g. "Modernize the toolchain",
  "Modernize the reader"). The answer determines how much nesting is real versus
  ceremonial.
- `AGENTS.md` and the two skills (`task-prd`, `sync-task-issues`) all encode the
  current model and will need updating together, as the seventh-feature change showed.
- Raised by the user on 2026-09-22 after the "epic" inconsistency surfaced while
  adding the Dependency health feature.

## References

- [Evolving GitHub Issues and Projects (GA)](https://github.com/orgs/community/discussions/154148)
  — sub-issues and issue types reaching general availability
- [Sub-issues public preview](https://github.com/orgs/community/discussions/148714)
  — parent/child model and its constraints
- [Issue types public preview](https://github.com/orgs/community/discussions/148715)
  — the `Epic` / `Feature` / `Story` type hierarchy
- [Hierarchy view in GitHub Projects](https://github.com/orgs/community/discussions/184225)
  — the registry view, public preview
