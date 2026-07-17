---
name: task-prd
description: Open a new task PRD, create a parent task, or look up the PRD template. Use when the user asks to "make a task for X", "open a TASK-NNN for this", "create a PRD", "track this as a task", or when starting work that needs a tracked unit. Also use when the work spans multiple sub-tasks and a parent task is needed first.
---

# Task PRD

Creates and structures task files in `tasks/` at the monorepo root.

---

## Step 1 — Get the next task number

```bash
ls tasks/*.md tasks/*.open.md 2>/dev/null | grep -oP 'TASK-\K\d+' | sort -n | tail -1
```

Increment by 1 for the new TASK-NNN.

---

## Step 2 — Create the PRD file

Create `tasks/TASK-NNN.open.md` with this template:

```markdown
# TASK-NNN: Short title

**Status:** not started
**Feature:** Upgrade tooling | Migrate JS→TS | Unit test coverage | E2E testing | Node.js modernization | React 19 (reader-react)
**Scope:** monorepo | <package-name>
**Priority:** high | medium | low
**GitHub Issue:** (add only for an epic or active task — see below)

## Description

What needs to be done and why.

## Subtasks

- [ ] Discrete step

## Notes

Decisions, blockers, relevant context.
```

Notes on each field:
- **Feature** — every task belongs to exactly one of the six features (epics).
  If it fits none, reframe the task or raise a new feature; do not leave it blank.
- **Scope** — use `monorepo` for cross-package work; use the package name (e.g. `b-ber-cli`) for single-package tasks. (Tasks still live in the root `tasks/` dir regardless of scope — there are no per-package task directories.)
- **Priority** — high = blocks other work or is a safety gate; medium = unblocked and should be done this cycle; low = good to have
- **GitHub Issue** — only create one for a feature epic or an in-progress/next-up
  task; fill in after running `/sync-task-issues`. Backlog stubs don't need issues.

---

## Step 3 — Create the GitHub issue

After writing the PRD, create the matching issue. See `/sync-task-issues` Step 3
for the exact `gh issue create` command and label table.

Add the resulting `#NNN — <url>` to the PRD's `**GitHub Issue:**` field.

---

## Parent tasks

When the work spans multiple sub-tasks, has a dependency chain, or will evolve
over time (e.g. a multi-stage migration, a large feature), create a parent task
first. The parent is the single canonical source for the overall goal.

A parent task should:
- Describe the goal at a level that doesn't require reading sub-tasks to understand
- List all sub-tasks with their IDs and one-line descriptions
- Hold architecture diagrams, dependency topology, and branching strategy
- Be updated as requirements shift — this is the one task file that grows over time
- Reference prior closed research tasks rather than duplicating their content

Sub-tasks reference the parent in their Notes section. When a sub-task completes,
check it off in the parent task as well as closing the sub-task file.

Parent tasks use the same PRD template. Add a `## Sub-tasks` section:

```markdown
## Sub-tasks

- [ ] TASK-NNN+1: First sub-task title
- [ ] TASK-NNN+2: Second sub-task title
```

---

## Updating and closing tasks

- Set status to `in progress` when starting; `complete` when done.
- Update subtask checkboxes as work progresses — do not batch.
- When complete: rename the file to remove `.open` (e.g. `TASK-NNN.open.md` → `TASK-NNN.md`) and close the GitHub issue.

Do not edit a task file once it is `complete` and the `.open` suffix is removed.
If work needs to continue after a task closes, open a new task referencing the original by ID.
Exception: minor factual corrections (wrong issue number, broken link, typo) — note
the correction in the Notes section.
