# TASK-171: Add a bber toc command to update the navigation files

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #834 — https://github.com/triplecanopy/b-ber/issues/834
**Scope:** b-ber-cli, b-ber-tasks

## Description

From [TASK-160](./TASK-160.md): the explicit replacement for the build's automatic append to
`toc.yml`, which was always error-prone.

`bber toc` adds the Markdown files missing from the project's navigation
files, and reports entries that have no file. It doesn't delete them, because
nested structures can't be rewritten safely. `--dry-run` lists the changes
without writing them. `bber generate` already appends to `toc.yml` and the
overrides, so the two share the writer.

It breaks nothing, so it can ship in a minor release before 5.0.

## Subtasks

- [ ] The command, with `--dry-run`
- [ ] Share the writer with `bber generate`
- [ ] Writes to whichever navigation files apply: `<target>.yml` today, the configured `navigation` files after TASK-172
- [ ] Tests on a temp project: missing files added, nested structure kept, nothing deleted

## Notes

- Design: [TASK-160](./TASK-160.md), "A build never writes to the source tree".
- Independent of the rest of the plan.
