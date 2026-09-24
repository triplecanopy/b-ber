---
name: sync-task-issues
description: Audit and sync root-level task PRDs in tasks/ against GitHub issues and the epic hierarchy. Use this when completing a task, opening new tasks, when the issue tracker seems out of sync, or when you need to create, close, label, or re-parent a GitHub issue for a task.
---

# sync-task-issues

Audits task PRDs in `tasks/` against issues in `triplecanopy/b-ber` and the epic
sub-issue tree.

**Policy (changed 2026-09-23, TASK-126):** **every open task has an issue**, and
every task issue is a sub-issue of its epic. The old "issues mirror only the active
working set" rule is gone — under it, a backlog task with no issue was correct;
now it is a hole in the hierarchy. **Closed tasks are not backfilled**: the 90
pre-migration ones stay as files, and their issues, where they exist, were never
parented. That is fine and the check ignores them.

---

## Step 0 — Run the check first

Most of this skill is automated. Start here and only do by hand what it reports:

```bash
npm run check:tasks          # epic vocabulary, offline
npm run check:tasks:remote   # + titles and parents, needs gh auth
```

It validates that every task file's `**Epic:**` is declared in `tasks/EPICS.json`,
that each open task's issue exists and is titled identically, and that the issue's
parent chain reaches the declared epic. Its output names the file, the issue, and
the disagreement.

If it is clean and you are not creating or closing anything, you are done.

---

## Step 1 — Build the ground truth

```bash
# Task files and the issue each one claims
grep -H '^\*\*GitHub Issue:\*\*' tasks/TASK-*.md

# The epic tree as GitHub sees it
jq -r '.epics | to_entries[] | "\(.value)\t\(.key)"' tasks/EPICS.json |
  while IFS=$'\t' read -r n name; do
    echo "── #$n $name"
    gh api "repos/triplecanopy/b-ber/issues/$n/sub_issues" \
      --jq '.[] | "     #\(.number) [\(.state)] \(.title)"'
  done

# Open issues with no parent — candidates that fell out of the tree
gh issue list --limit 200 --state open --json number,title,issueType,parent \
  --jq '.[] | select(.issueType.name != "Epic") | select(.parent == null) | "#\(.number) \(.title)"'
```

Build four lists:

- **A** — open task files with no `**GitHub Issue:**` → create the issue
- **B** — task files whose issue is open but whose work is finished → close it
- **C** — task issues whose parent is missing or wrong → re-parent
- **D** — open task issues with no task file → write the PRD, or close the issue

---

## Step 2 — Create missing issues (list A)

```bash
gh issue create \
  --title "TASK-NNN: <exact title from the PRD heading>" \
  --type Task \
  --parent <epic issue from tasks/EPICS.json> \
  --label "<label>" \
  --body "$(cat <<'EOF'
<one-paragraph summary drawn from the PRD Description>

**Task file:** [tasks/TASK-NNN.md](https://github.com/triplecanopy/b-ber/blob/main/tasks/TASK-NNN.md)
EOF
)"
```

`--parent` at creation time is what keeps the tree whole; do not create first and
parent later, because "later" is where holes come from.

The title must match the PRD heading **exactly** — the check compares them
character for character.

---

## Step 3 — Close finished work (list B)

Normally you never do this by hand: the PR that does the work says `Closes #NNN`
and merging closes the issue.

> 🛑 **Only the PR that does the work may say `Closes`.** A PR that merely files a
> PRD uses `Refs #NNN`. On 2026-09-22 PR #605 added the TASK-118 PRD with
> `Closes #604` and silently closed a task nobody had started; it went unnoticed
> until the next day's audit.

If you must close by hand:

```bash
gh issue close <number> --comment "Completed in <PR or commit>."
```

Before closing, confirm the work actually happened — check the tree, not the task
file. `.circleci/config.yml` still existing is what proved TASK-118 was not done.

---

## Step 4 — Fix parentage (list C)

```bash
gh issue edit <number> --parent <epic or parent-task issue>
gh issue edit <number> --type Task          # if the type is missing
```

A task may hang off a parent *task* rather than the epic (TASK-122–125 under
TASK-121). That is correct and the check walks the chain upward. What is wrong is
an empty parent, or a chain that reaches a different epic than the file declares.

Decide which side is right before editing: if the file's `**Epic:**` is the
mistake, fix the file; if the parent link is, fix GitHub. The check cannot tell
you which — it only tells you they disagree.

---

## Step 5 — Labels

Every issue needs at least one. Issue **type** (`Epic`/`Task`/`Bug`) carries the
hierarchy; labels carry scope.

| Task type                            | Labels                            |
| ------------------------------------ | --------------------------------- |
| TypeScript migration                 | `b-ber/typescript`                |
| Test coverage                        | `b-ber/testing`                   |
| Circular dep / architecture audit    | `b-ber/typescript`, `maintenance` |
| Linting / toolchain                  | `maintenance`                     |
| Grammar packages                     | `b-ber/grammar`                   |
| Build pipeline / bundler             | `b-ber/build`                     |
| CLI                                  | `b-ber/cli`                       |
| Core library (b-ber-lib, logger)     | `b-ber/lib`                       |
| Tasks package (b-ber-tasks)          | `b-ber/tasks`                     |
| Reader                               | `b-ber/build/reader`              |
| Themes / SCSS                        | `b-ber/themes`                    |
| EPUB output / validation             | `b-ber/build/epub`                |
| Dependencies / Dependabot            | `dependencies`                    |
| Research / planning                  | `maintenance`                     |

Create a new label (`gh label create`) only if none fits — follow the
`b-ber/<scope>` convention.

---

## Step 6 — Adding an epic

Three things, together, or the check fails:

1. A line in `tasks/EPICS.json`
2. An issue of type `Epic` whose body carries the sequencing and its reasoning
3. A row in the epics table in `AGENTS.md`

```bash
gh issue create --title "Epic: <name>" --type Epic --label <label> --body-file <file>
```

---

## Step 7 — Verify

```bash
npm run check:tasks:remote
```

Clean output is the only acceptable end state. Do not hand-verify what the check
already covers.

---

## Notes

- The `blob/main/tasks/TASK-NNN.md` link only resolves once the branch merges.
  Write it at creation time anyway.
- The Project board (https://github.com/orgs/triplecanopy/projects/3) auto-adds new
  issues as Todo and marks closed ones Done. You should not need to touch it.
- Only create an issue for a task that has a PRD file. If work is named somewhere
  but has no file, write the PRD first (`/task-prd`).
