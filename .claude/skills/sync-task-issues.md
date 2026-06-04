# Skill: sync-task-issues

Audit and synchronise the state between task PRD files in `tasks/` and GitHub
issues in `triplecanopy/b-ber`. Run this skill whenever completing a task,
opening new tasks, or when the issue tracker appears out of sync.

**Scope:** root-level tasks only (`tasks/TASK-NNN[.open].md`).
Package-level tasks (`packages/*/tasks/`) are too granular for GitHub and are
intentionally excluded.

---

## Step 1 — Build the ground truth

Run these three commands to collect state:

```bash
# 1. All root task files with their status (open vs. closed)
ls tasks/*.md tasks/*.open.md 2>/dev/null | sort

# 2. Which task files already carry a GitHub Issue field
grep -l "GitHub Issue" tasks/*.md tasks/*.open.md 2>/dev/null

# 3. All GitHub issues (open and closed) with numbers and titles
gh issue list --limit 200 --state all --json number,title,state \
  | jq -r '.[] | "\(.state)\t#\(.number)\t\(.title)"' | sort -t'#' -k2 -n
```

From the output, build three lists:
- **A** — task files that need a new issue (no `**GitHub Issue:**` field and no matching issue title)
- **B** — completed task files (no `.open` extension) whose GitHub issue is still OPEN
- **C** — open task files whose GitHub issue has been incorrectly CLOSED

---

## Step 2 — Close issues for completed tasks (list B)

For each completed task that has an open issue:

```bash
gh issue close <number> --comment "Completed. Work merged into feat/upgrades."
```

No further edits needed — the issue title and body already identify the task.

---

## Step 3 — Create issues for new tasks (list A)

For each task file without an issue, create one:

```bash
gh issue create \
  --title "TASK-NNN: <exact title from PRD>" \
  --body "$(cat <<'EOF'
<one-paragraph summary drawn from the PRD Description>

**Task file:** tasks/TASK-NNN[.open].md
_(Link becomes navigable after `feat/upgrades` is merged to `main`.)_
EOF
)" \
  --label "<label1>" [--label "<label2>"]
```

**Label reference** (from AGENTS.md):

| Task type                            | Labels                           |
| ------------------------------------ | -------------------------------- |
| TypeScript migration                 | `b-ber/typescript`               |
| Test coverage                        | `b-ber/testing`                  |
| Circular dep / architecture audit    | `b-ber/typescript`, `maintenance` |
| Linting / toolchain                  | `maintenance`                    |
| Grammar packages                     | `b-ber/grammar`                  |
| Build pipeline / bundler             | `b-ber/build`                    |
| CLI                                  | `b-ber/cli`                      |
| Core library (b-ber-lib, logger)     | `b-ber/lib`                      |
| Tasks package (b-ber-tasks)          | `b-ber/tasks`                    |
| Reader                               | `b-ber/build/reader`             |
| Themes / SCSS                        | `b-ber/themes`                   |
| Research / planning                  | `maintenance`                    |
| E2E testing                          | `b-ber/testing`                  |

Every issue must have **at least one label**. Create a new label (`gh label
create`) only if no existing label fits — follow the `b-ber/<scope>` convention.

---

## Step 4 — Add `**GitHub Issue:**` to the task PRD

After creating (or confirming) an issue, edit the task file header block:

```markdown
**Status:** not started   ← (or in progress / complete)
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #NNN — https://github.com/triplecanopy/b-ber/issues/NNN
```

Insert the `**GitHub Issue:**` line immediately after `**Priority:**`.

---

## Step 5 — Re-open issues wrongly closed (list C)

If an issue was closed for a task that is still open:

```bash
gh issue reopen <number> --comment "Reopened — task is still in progress."
```

---

## Step 6 — Verify

```bash
# Confirm no root task file is missing an issue reference
grep -rL "GitHub Issue" tasks/*.md tasks/*.open.md 2>/dev/null

# Confirm no completed task has an open issue
gh issue list --state open --json number,title \
  | jq -r '.[].title' | grep "^TASK-"
# Cross-reference each printed TASK-NNN against the task file status
```

---

## Notes

- The task file URL (`blob/main/tasks/TASK-NNN.md`) only resolves after the
  branch containing the file is merged to `main`. Add the URL to the issue body
  at creation time anyway; it will start resolving once the branch lands.
- Task numbers are **not** globally unique (root tasks and package tasks share
  the numbering). The full path is always required in issue bodies.
- Do not create issues for TASK-043 or TASK-044 until their PRD files exist.
