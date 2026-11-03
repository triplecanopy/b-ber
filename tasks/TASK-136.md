# TASK-136: Stop closing keywords from closing issues by accident

**Epic:** Upgrade tooling
**GitHub Issue:** #693 — https://github.com/triplecanopy/b-ber/issues/693
**Scope:** monorepo

## Description

GitHub closes an issue whenever a closing keyword (`close`, `fix`, `resolve` and
their `-s`/`-d` forms) followed by an issue reference reaches it: from a PR body
when the PR merges, and from a commit message when the commit reaches `main`.
Code spans do not protect it. This has closed issues by accident three times:

| When | Issue | Cause |
| ---- | ----- | ----- |
| 2026-09-22 | #604 (TASK-118) | PR #605 filed the PRD and its body used the keyword |
| 2026-09-24 | #604 again | Commit `0a27b365` (TASK-126) **described** the first incident, quoting the keyword and the number |
| 2026-09-24 | #591 (TASK-115) | The same commit, mentioning an earlier incident. TASK-115's work turned out to be finished (`NPM_TOKEN` set, the orphan `v4.0.1` tag deleted, 4.0.3 published through the workflow), so it stayed closed |

#604 was reopened on 2026-11-01; CircleCI is still running.

Two things kept setting the trap:

- **The PR template started with `Fixes #`.** Every new PR pre-filled a closing
  keyword, so closing was the default and referencing was the exception.
- **AGENTS.md's warning only covered PR bodies**, and only the "files a PRD"
  case. Nothing said that commit messages count, that quoting counts, or how to
  check.

## Changes

- `.github/PULL_REQUEST_TEMPLATE.md`: starts with `Refs #`. An HTML comment
  explains when to switch to `Closes` and warns against quoting keywords next to
  other issues' numbers.
- AGENTS.md "Only the PR that does the work may say `Closes`": extended to commit
  messages and quoting, with all three incidents, the "say 'the closing keyword'"
  convention, and a `git log | grep` check to run before pushing. The check was
  tested against `0a27b365`; it reports both of that commit's accidental
  closes.

## Subtasks

- [x] Change the PR template to `Refs #` with guidance
- [x] Extend the AGENTS.md warning, with a pre-push check
- [x] Confirm the check catches `0a27b365`'s two accidental closes
- [x] Establish whether #591 needs reopening: no, its work is done

## Notes

- Not done: enforcing the check in a hook or CI. A `commit-msg` hook could flag
  keyword-plus-number, but the intentional case (`Closes #N` in the PR that does
  the work) is common, so it would have to warn rather than block. Revisit if it
  happens again.
- TASK-115's PRD still shows three unticked subtasks that are in fact done. Its
  issue is closed, so the file stays as it is per the closed-task rule. This
  table is the record.
