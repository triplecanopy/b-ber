# TASK-181: Migrate old config.yml keys when the file is read

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #845 — https://github.com/triplecanopy/b-ber/issues/845
**Scope:** b-ber-lib

## Description

From [TASK-162](./TASK-162.md): existing projects keep working. Old keys are read and mapped
to the new ones when `config.yml` is loaded, with one warning per old key
naming its replacement. The mapping stays for at least one major release.

The mappings, from [TASK-162](./TASK-162.md)'s key set:

| Old | New, or what happens |
| --- | -------------------- |
| `base_url`, `reader_url` | `web.url`, `reader.url` |
| `remote_url` | dropped in favour of `reader.url`; if the two differ, warn and use `reader_url` |
| `private` | `noindex` |
| `layout`, `downloads` | `reader.layout`, `reader.downloads` |
| `ui_options` | `reader.controls` (flat booleans) |
| `group_footnotes: false` | `footnotes.numbering: book` |
| `pdf_options` | `pdf.calibre`, keys camelCased |
| `bucket_url` | `deploy.bucket` |
| `ibooks_specified_fonts: false` | warn: the OPF now always writes `true` |
| `themes_directory` other than `./themes` | warn: rename the directory to `themes/` (`tc-bber-theme` does this) |
| `autoprefixer_options` | warn: use a browserslist config (no GitLab project has a custom list) |
| `env`, `cache`, `base_path`, `builds`, `ignore`, `uglify_options`, `remote_javascripts`, `remote_stylesheets` | removed: one grouped warning naming them |

Every scaffolded project pins every default, so a naive migration would warn
about up to 18 keys per project. A key whose value is the old default is
dropped silently.

## Subtasks

- [ ] The mapping, with a test for every row
- [ ] Silent for a key set to its old default; one grouped warning for removed keys
- [ ] Run it over the GitLab projects (`gitlab-projects/_survey/`): every `config.yml` migrates without an error, and the warnings match an expected list
- [ ] Optional: `bber config migrate`, which writes the new form back. Not required

## Notes

- The `<target>.yml` fallback is TASK-172's, not this task's.
- Ships in the same release as TASK-180.
