# TASK-169: Move every target's output under <dist>/<target>/

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #832 — https://github.com/triplecanopy/b-ber/issues/832
**Scope:** b-ber-tasks, b-ber-cli

## Description

A 5.0 breaking change from [TASK-160](./TASK-160.md)'s Plan step 6.

Today each target writes `<dist>-<target>/` beside `dist`, and the packaged
files (`<identifier>.epub`/`.mobi`/`.pdf`, `<uuid>.xml`) land in the project
root, where `clean` deletes `*.<target>`. After this:

```
<dist>/
  epub/<identifier>.epub     mobi/…   pdf/…   xml/<uuid>.xml
  web/…   reader/…   sample/…
  .work/<target>-<hash>/     intermediates and staging
```

A target owns exactly `<dist>/<target>/`. `clean` removes that directory, and
nothing outside `dist` is touched. For epub, mobi and pdf the unpacked tree is
an intermediate, kept only when `--no-compile` asks for it.

## Subtasks

- [ ] Each target builds in `.work/` and renames its deliverable into `<dist>/<target>/`
- [ ] Packaged files written inside the target's directory
- [ ] `clean` removes `<dist>/<target>/` only
- [ ] `deploy` and `serve` follow the new paths (`deploy` hardcodes `project-reader/*` and `project-web/*` today)
- [ ] Golden snapshot regenerated; release notes for the moved output

## Notes

- Design: [TASK-160](./TASK-160.md), "Output layout".
- The `dist` default becomes `dist` ([TASK-162](./TASK-162.md)). Every GitLab project sets
  `dist: project` explicitly, so their output moves to `project/<target>/`.
- Depends on TASK-166. Merge only once 5.0 is the next release.
