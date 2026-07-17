# TASK-018: Add task file links to GitHub issues

**Status:** complete
**Feature:** Upgrade tooling
**Scope:** monorepo
**Priority:** low
**GitHub Issue:** #478 — https://github.com/triplecanopy/b-ber/issues/478

> **Closed as obsolete (2026-06-11).** Superseded by two changes: (1) the
> relaxed issue policy — issues now mirror only feature epics + the active set,
> not every task, so a bulk back-link pass over all historical issues is no
> longer wanted; and (2) the task-system flatten — the package task paths this
> lists (`packages/*/tasks/...`, issues #460–470) no longer exist. New issues
> already include a `**Task file:**` link at creation time per AGENTS.md, which
> covers the intent going forward.

## Description

GitHub issues currently contain only a one-paragraph summary. They do not link
back to the task PRD file in the repository, which is where the full context,
subtask checklist, and technical notes live. Add a direct link from each issue
body to its task file on GitHub so that either artifact leads to the other
without ambiguity.

This is the complement to the `**GitHub Issue:** #NNN — <url>` line already
present in every task PRD (added in TASK-014).

## Subtasks

- [ ] For each closed task issue listed below, edit the issue body to add a
      **Task file** line in the header block, using the format documented in
      AGENTS.md
- [ ] Confirm every link resolves (requires `feat/upgrades` to be merged to
      `main` first, since the task files live on that branch)

## Issues to update

### Root-level tasks

| Issue | Task file path      |
| ----- | ------------------- |
| #456  | `tasks/TASK-001.md` |
| #457  | `tasks/TASK-002.md` |
| #458  | `tasks/TASK-003.md` |
| #459  | `tasks/TASK-005.md` |

### b-ber-templates

| Issue | Task file path                               |
| ----- | -------------------------------------------- |
| #460  | `packages/b-ber-templates/tasks/TASK-001.md` |

### b-ber-reader-react

| Issue | Task file path                                  |
| ----- | ----------------------------------------------- |
| #461  | `packages/b-ber-reader-react/tasks/TASK-001.md` |
| #462  | `packages/b-ber-reader-react/tasks/TASK-002.md` |
| #463  | `packages/b-ber-reader-react/tasks/TASK-003.md` |
| #464  | `packages/b-ber-reader-react/tasks/TASK-004.md` |
| #465  | `packages/b-ber-reader-react/tasks/TASK-005.md` |
| #466  | `packages/b-ber-reader-react/tasks/TASK-006.md` |
| #467  | `packages/b-ber-reader-react/tasks/TASK-007.md` |
| #468  | `packages/b-ber-reader-react/tasks/TASK-008.md` |
| #469  | `packages/b-ber-reader-react/tasks/TASK-011.md` |
| #470  | `packages/b-ber-reader-react/tasks/TASK-015.md` |

## URL format

Once `feat/upgrades` is merged to `main`, task files are accessible at:

```
https://github.com/triplecanopy/b-ber/blob/main/<task-file-path>
```

Example for #456:

```
https://github.com/triplecanopy/b-ber/blob/main/tasks/TASK-001.md
```

## Notes

- Do not edit the issues until `feat/upgrades` is merged; the links will 404 until then.
- Future issues (created after this task is done) should include the task file
  link at creation time — see the updated convention in AGENTS.md.
