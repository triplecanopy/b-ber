# TASK-189: Track tasks in GitHub issues and Projects only

**Epic:** Upgrade tooling
**GitHub Issue:** #862 — https://github.com/triplecanopy/b-ber/issues/862
**Scope:** monorepo

## Description

Every task lives twice: a PRD in `tasks/TASK-NNN.md` and an issue that points
at it. TASK-126 (2026-09-23) gave each fact one home, but kept the PRD in the
repo, and keeping the two halves joined is now most of the overhead of
tracking work:

- **Filing a task needs a pull request.** #843, #849, #852 and #856 each
  merged only task files. A task can't be referenced from `main` until its
  filing PR merges.
- **Findings land through merges too.** A task branch carries its PRD edits,
  so two branches touching the same task conflict, and a stacked PR's PRD
  edits can be stranded. TASK-175's were: #858 merged into a branch that had
  already been squash-merged, and was re-landed as #859.
- **The halves are reconciled by tooling that exists only for that.**
  `scripts/check-tasks.js` (offline and `--remote`), `tasks/EPICS.json`, the
  daily `task-hierarchy.yml` workflow, the `task-files` CI job and inert tier in
  `scripts/ci-changes.js`, the issue title that must match the PRD heading
  exactly, and the `/task-prd` and `/sync-task-issues` skills.

**Direction:** the issue is the task. Its body is the PRD (description,
subtasks as a task list, notes), findings are comments, and the Project
board's fields stay what they are (Status, Priority). Epics stay as `Epic`
issues with sub-issues, and their bodies keep the sequencing. `tasks/` stops
being written.

## Subtasks

- [ ] Decide the open questions below, and record the decisions here
- [ ] Copy each **open** task's PRD into its issue body (a script, not by hand),
      with a link to the file's last commit for its history
- [ ] Remove `scripts/check-tasks.js`, `check:tasks` from `npm test`,
      `check:tasks:remote`, `.github/workflows/task-hierarchy.yml`, and
      `tasks/EPICS.json`; or keep a GitHub-only hierarchy check, if one is
      still worth having (open question 4)
- [ ] `scripts/ci-changes.js`: drop the task-PRD rule and the `task-files`
      job, with their tests
- [ ] Rewrite AGENTS.md's Task System, Closing a task, GitHub Issues, Quality
      Gates and branch-naming text for issue-only tracking
- [ ] Replace `/task-prd` and `/sync-task-issues` with one skill that files an
      issue under its epic and reports the tree
- [ ] Settle what `tasks/` becomes (open question 1)

## Open questions

1. **The closed PRDs.** About 185 files, with findings that code comments
   point at (`TASK-161's Findings`, `see TASK-153`): 101 `TASK-NNN` references
   in `packages/*/src`, `scripts` and `.github`. Options: keep `tasks/` as a
   frozen, read-only archive; move it under `docs/`; or delete it and rely on
   git history. Recommendation: keep it frozen in place, so the references
   still resolve, with a README saying nothing new goes in.
2. **Task IDs.** Keep `TASK-NNN` in issue titles and branch names, or use the
   issue number (`#860-slug`)? The issue number is unique already; `TASK-NNN`
   is a second sequence to keep in step.
3. **Where agents write as they work.** A subagent can't safely edit an issue
   body: two at once clobber each other silently. Today they edit the PRD
   file and the parent syncs. Options: agents post findings as issue
   comments (append-only, so nothing clobbers) and only the orchestrator edits
   bodies; and a local, uncommitted handoff file (`.claude/HANDOFF.md`, in
   use since 2026-11-28) for the direction of a working session.
4. **Is any automated check still needed?** With one home per fact there is
   little to reconcile. A daily report of open `Task` issues with no parent
   may be enough.

## Notes

- Priority: high on the board (the user, 2026-11-28). It removes overhead from
  every other task.
- This supersedes the PRD-in-repo half of TASK-126; TASK-126's sub-issue tree
  and board fields stay.
- Until this lands, the current conventions still apply. This PRD itself is a
  task file because of them.
