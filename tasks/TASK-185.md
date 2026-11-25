# TASK-185: Use camelCase keys in metadata.yml and the navigation files

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #850 — https://github.com/triplecanopy/b-ber/issues/850
**Scope:** b-ber-lib, b-ber-tasks, b-ber-templates

## Description

Decided in [TASK-162](./TASK-162.md) on 2026-11-25: **every key a project
writes is camelCase. One format.** Where something downstream needs another
form, the app converts it. `config.yml` moves in TASK-180 and TASK-181. This
task moves the other two files that have snake_case keys:

| File | Old | New | GitLab projects |
| ---- | --- | --- | --------------- |
| `metadata.yml` | `term_property`, `term_property_value` | `termProperty`, `termPropertyValue` | 106 of 263 (952 uses each) |
| `toc.yml` and the `<target>.yml` overrides | `in_toc` | `inToc` | 250 of 263 (2,331 uses) |

The `term` values are Dublin Core terms (`title`, `date`, …), not keys, and
don't change. No Markdown front matter uses an underscored key.

**Existing projects keep working.** Both forms are read for at least one
major release, and a file may mix them. Nearly every project uses the old
keys, many times per file, so the warning is **one per file**, naming the old
keys and how many there are, never one per entry.

## Subtasks

- [ ] Read both forms: `metadata.yml` (`Yaml.ts`'s schema and its readers) and the navigation files (`Spine`, `SpineItem`)
- [ ] One warning per file that uses an old key
- [ ] Every writer writes camelCase: the `bber new` templates, `bber generate`'s append, `bber toc` (TASK-171), and, until TASK-170 removes them, the build's navigation append and `cover`'s `metadata.yml` write
- [ ] Convert the kitchen-sink fixture. Output is unchanged: the golden test passes as is
- [ ] Run over the GitLab projects (`gitlab-projects/_survey/`): every file reads without an error, with the expected warnings
- [ ] Update the docs

## Notes

- If TASK-181 adds its optional `bber config migrate`, it should rewrite
  these files too, so there's one command that brings a project to the new
  form.
- Ship in the same release as TASK-181, so a project sees all of its
  migration warnings at once.
- `bber toc` (TASK-171) writes `inToc` from the start.
