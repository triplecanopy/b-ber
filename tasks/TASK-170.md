# TASK-170: Stop builds from writing to the source directory

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #833 — https://github.com/triplecanopy/b-ber/issues/833
**Scope:** b-ber-tasks, b-ber-lib

## Description

A 5.0 breaking change from [TASK-160](./TASK-160.md)'s Plan step 6.

Only `bber new` and the commands that exist to edit a project write to the
source directory. Today `bber build` writes to it in four places:

| Where | Today | After |
| ----- | ----- | ----- |
| `cover` | generates a cover into `_images/`, prunes old ones, rewrites `metadata.yml` | generated into `.work/` for that run; `metadata.yml` only read |
| `opf/Navigation.ts` | appends Markdown files missing from the navigation to it | warns, and points at `bber toc` (TASK-171) |
| `sass` | copies the theme's fonts and images into `_fonts/` and `_images/` | copies them straight into the build |
| `State` at import | creates `_media/` and the themes directory | a missing optional directory reads as empty |

## Subtasks

- [ ] cover
- [ ] Navigation: warn instead of appending
- [ ] sass
- [ ] No directories created on load
- [ ] A boundary test that a build leaves the source tree byte-for-byte unchanged

## Notes

- Design: [TASK-160](./TASK-160.md), "A build never writes to the source tree".
- TASK-171 should land first, so the warning has a command to point at.
