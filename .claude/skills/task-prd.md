---
name: task-prd
description: Open a new task PRD, create a parent task, or look up the PRD template. Use when the user asks to "make a task for X", "open a TASK-NNN for this", "create a PRD", "track this as a task", or when starting work that needs a tracked unit. Also use when the work spans multiple sub-tasks and a parent task is needed first.
---

# Task PRD

Creates and structures task files in `tasks/` at the monorepo root, and the
matching GitHub issue under the right epic.

**The model:** the file holds the PRD; GitHub holds state and relationships.
Nothing about a task's status, priority, or progress belongs in the file — see
"Where each fact lives" in `AGENTS.md`. Creating a task means writing one file
and opening one issue, in that order.

---

## Step 1 — Get the next task number

```bash
ls tasks/TASK-*.md | grep -oE 'TASK-[0-9]{3}' | sort -u | tail -1
```

Increment by 1. Numbers are a single root-wide sequence and are never reused.

---

## Step 2 — Write the PRD

Create `tasks/TASK-NNN.md` — no `.open` suffix, open and closed tasks are named
alike:

```markdown
# TASK-NNN: Short title

**Epic:** Upgrade tooling
**GitHub Issue:** (fill in after step 3)
**Scope:** monorepo | <package-name>

## Description

What needs to be done and why.

## Subtasks

- [ ] Discrete step

## Notes

Decisions, blockers, relevant context.
```

Only three header fields, and each is there for a reason:

- **Epic** — exactly one, and it must be a key in
  [`tasks/EPICS.json`](../../tasks/EPICS.json). `npm run check:tasks` fails the
  build on anything else, which is what stops invented values. If the task fits no
  epic, reframe it or raise a new epic — do not leave it blank.
- **GitHub Issue** — `#NNN — <url>`. Every open task has one now; the old
  "active working set only" policy is gone.
- **Scope** — `monorepo` for cross-package work, otherwise the package name
  (`b-ber-cli`). Tasks live in the root `tasks/` regardless — there are no
  per-package task directories.

> **Do not add `**Status:**`, `**Priority:**`, or a `.open` suffix.** Status is
> the issue being open or closed; priority is a field on the Project board. Both
> lived in the file once and drifted within a day — that is what TASK-126 removed.

---

## Step 3 — Open the issue, parented to its epic

One command does both:

```bash
gh issue create \
  --title "TASK-NNN: <exact title from the PRD>" \
  --type Task \
  --parent <epic issue number> \
  --label "<scope label>" \
  --body "$(cat <<'EOF'
<one-paragraph summary drawn from the PRD Description>

**Task file:** [tasks/TASK-NNN.md](https://github.com/triplecanopy/b-ber/blob/main/tasks/TASK-NNN.md)
EOF
)"
```

Epic issue numbers are in `tasks/EPICS.json`. Labels are in `/sync-task-issues`.

**The title must match the PRD heading exactly** — `check:tasks --remote`
compares them.

Then write the issue back into the header and verify:

```bash
npm run check:tasks
```

---

## Parent tasks

When work spans several sub-tasks with a real dependency chain, create a parent
task first. It is a normal task with normal sub-issues — GitHub's tree is not
limited to two levels, so a parent task's children hang off the *task*, not the
epic:

```
Epic: Dependency health (#618)
└── TASK-121  parent (#610)
    ├── TASK-122 (#636)
    └── TASK-123 (#637)
```

Create the children with `--parent <the parent task's issue>`. Their `**Epic:**`
field still names the epic — the check walks the parent chain upward, so a
grandchild resolves correctly.

Use this only where the nesting is real. Do not invent a middle layer to make the
tree look uniform; most tasks hang directly off their epic.

A parent task should:

- Describe the goal without requiring the sub-tasks to be read
- List all sub-tasks with IDs and one-line descriptions
- Hold the dependency order **and the reasons for it**
- Be updated as requirements shift — it is the one task file that grows
- Reference prior closed research tasks rather than restating them

If the ordering matters to anyone outside the parent's own sub-tree, it belongs in
the **epic body** instead, which is where sequencing lives.

---

## Updating and closing

- Tick subtask checkboxes as work progresses — do not batch them at the end.
- **To close: nothing.** The PR that does the work says `Closes #NNN` in its body;
  merging closes the issue and the board moves the card to Done. There is no status
  field to set, no file to rename, no index to update.

> 🛑 **Only the PR that does the work may say `Closes`.** A PR that merely *files*
> a PRD must use `Refs #NNN`. PR #605 said `Closes #604` while adding the TASK-118
> PRD and silently closed a task nobody had started.

Do not edit a task file once its issue is closed. If work needs to continue, open a
new task referencing the original by ID. Exception: minor factual corrections
(wrong issue number, broken link, typo) — note the correction in the Notes section.
