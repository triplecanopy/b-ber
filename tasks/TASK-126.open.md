# TASK-126: Replace PLAN.md with an epic → task hierarchy

**Status:** not started
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #612 — https://github.com/triplecanopy/b-ber/issues/612

## Decision (2026-09-23)

**Option A is chosen: GitHub sub-issues + issue types for the hierarchy, task PRD
files for the content.** Migration is deliberately deferred — this is the recorded
direction, not work in progress. Do not propose alternatives in a future session; if
GitHub's hierarchy turns out not to fit in practice, option B (a generated in-repo
registry) is the documented fallback.

**The `epic` vs `feature` terminology and the inconsistencies it creates are the
user's to resolve.** They are working out that plan separately. Do not redefine the
hierarchy unilaterally — the migration cannot start until those definitions land,
because they determine what the seven current "features" become.

What that leaves as prerequisites, in order:

1. User settles `epic ← feature ← task` definitions (**owned by the user**)
2. Create an `Epic` issue type on the `triplecanopy` org
3. Change `AGENTS.md`'s "issues mirror only the active working set" policy — a
   complete hierarchy needs an issue per task, or the tree has holes
4. Extract the live sequencing out of `PLAN.md` before retiring it

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

- [ ] **(user)** Settle the `epic ← feature ← task` definitions and the existing
      inconsistencies, replacing `AGENTS.md`'s interchangeable use of "feature
      (epic)". **Blocks everything below** — the definitions determine what the seven
      current features become
- [x] Decide between options A / B / C — **A chosen 2026-09-23**
- [ ] Create an `Epic` issue type on the org if going with A
- [ ] Decide whether every task gets an issue — the current "active working set only"
      policy in `AGENTS.md` is incompatible with a complete GitHub hierarchy
- [ ] Extract everything still live from `PLAN.md`: the 35 open tasks, the
      cross-feature dependency notes, and the per-epic sequencing (the Dependency
      health and React 19 sections carry ordering that exists nowhere else)
- [ ] Fix `TASK-004`'s stray `Unit test coverage (epic)` feature value
- [ ] Build the registry (generated, if B)
- [ ] Add a CI check that every task's `**Feature:**` is one of the declared values —
      this is what stops the next drift
- [ ] Retire `PLAN.md`: reduce it to a pointer, or delete it and update the ~20
      references in `AGENTS.md`, `README.md` and the skills
- [ ] Update `AGENTS.md`'s "Start here" instruction, which currently says to read
      `PLAN.md` first

## Notes

- **Do not delete `PLAN.md` before extracting the sequencing.** Its per-epic sections
  hold ordering and rationale that exist nowhere else — the Dependency health section
  records why TASK-122 must precede 123 and 123 must precede 124, and the React 19
  section holds a five-step migration plan. Closed task files are historical record;
  this ordering is live.
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
