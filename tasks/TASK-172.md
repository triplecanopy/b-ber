# TASK-172: Fold the <target>.yml navigation files into config.yml

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #835 — https://github.com/triplecanopy/b-ber/issues/835
**Scope:** b-ber-lib

## Description

A 5.0 change from [TASK-160](./TASK-160.md)'s Plan step 6, with the key from [TASK-162](./TASK-162.md).

The `<target>.yml` override files become a `navigation` key in the target's
section (`reader: { navigation: reader.yml }`), defaulting to `toc.yml`.
That removes a lookup by filename convention.

**This needs a migration.** 128 GitLab projects have `<target>.yml` files, and
in 71 of them at least one really differs from `toc.yml`. For one major
release, an existing `<target>.yml` with no `navigation` key is still read,
with a warning naming the line to add.

## Subtasks

- [ ] Read `navigation` from the resolved config
- [ ] The migration fallback and its warning, with tests
- [ ] Update the `bber new` template and the docs

## Notes

- Design: [TASK-160](./TASK-160.md), "What a target exposes to a project"; key and migration
  rules in [TASK-162](./TASK-162.md).
- Depends on TASK-163 and [TASK-162](./TASK-162.md)'s schema.
