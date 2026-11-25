# TASK-184: Scaffold a minimal config.yml in bber new

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #848 — https://github.com/triplecanopy/b-ber/issues/848
**Scope:** b-ber-tasks, b-ber-templates, b-ber-cli

## Description

From [TASK-162](./TASK-162.md)'s notes: stop writing every default into new projects.

`bber new` writes the whole default config into each project. So a changed
default never reaches it, and the migration has up to 18 keys to look at in
every existing project. New projects get only what an author is expected to
edit: `url`, `theme` and the navigation.

`bber new` also ignores two of its own options (audit bug 2):
- `--src content` writes `src: content` but scaffolds `_project/`, so the new
  project can't build;
- `--theme b-ber-theme-sans` writes `sans`, then `setTheme` reads the default
  from `state.config` and rewrites `config.yml` to `serif`.

## Subtasks

- [ ] A minimal `config.yml` template
- [ ] Fix `--src` and `--theme`
- [ ] Update the docs and the kitchen-sink fixture to the new keys (golden snapshot regenerated)
- [ ] A test that a project made by `bber new` with each option builds

## Notes

- Depends on TASK-180.
