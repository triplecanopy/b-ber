# TASK-183: Remove the dropped config keys and the code behind them

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #847 — https://github.com/triplecanopy/b-ber/issues/847
**Scope:** b-ber-tasks, b-ber-lib

## Description

From [TASK-162](./TASK-162.md): the keys that were decided removed, and what reads them.
The GitLab survey found that each is dead, inert, scaffolded, or used in one
place that has a replacement:

- `remote_javascripts`, `remote_stylesheets`: broken since they were added
  (#803), and no project sets them. Removing them settles #803;
- `ibooks_specified_fonts`: the OPF always writes `ibooks:specified-fonts`
  `true`. 212 of 263 projects already set it;
- `autoprefixer_options`: sass uses the project's browserslist config
  (`.browserslistrc` or `package.json`), with b-ber's default list when there
  is none. `flexbox: no-2009` stays internal;
- `themes_directory`: fixed at `themes/`;
- `ignore`, `uglify_options`, `env`, `cache`, `base_path`, `builds`: dead or
  inert.

## Subtasks

- [ ] Remove the remote asset handling from `inject` (its pinned defect test goes with it)
- [ ] OPF: always write `ibooks:specified-fonts` `true` (an output change for projects that set `false`)
- [ ] sass: read browserslist; drop the options key
- [ ] Themes directory fixed at `themes/`
- [ ] Remove the rest
- [ ] Golden snapshot regenerated if anything changes

## Notes

- Ships with TASK-181, so a project that sets one of these keys gets the
  migration's warning rather than silence.
- The PR that removes the remote assets closes #803.
