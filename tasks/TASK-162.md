# TASK-162: Simplify config.yml: fewer, clearer, camelCase keys

**Epic:** Build pipeline & directive redesign
**GitHub Issue:** #810 — https://github.com/triplecanopy/b-ber/issues/810
**Scope:** lib, cli, tasks

## Description

`config.yml` has grown keys that look unused, duplicated or confusingly
named. They are declared in four places that disagree, and some keys the code
reads are declared nowhere. The keys are snake_case in the file, and parts of
the code convert them to camelCase (the reader manifest turns `ui_options`
into `uiOptions`).

The goal is a config that is:
- **as small as possible**: every key earns its place;
- **easy to remember**: names say what they do, related settings group
  together;
- **camelCase**, the convention from here on;
- **declared once**: one schema, from which the defaults, the type, the
  validation and the CLI flags all derive.

**Existing projects keep working.** Old keys are read and mapped to new ones
when `config.yml` is loaded, with one warning per old key naming its
replacement. The mapping stays for at least one major release. Writing the
new form back (e.g. a `bber config migrate` command) is a possible extra, not
a requirement.

This is separate from the pipeline design (TASK-160), which depends only on
config being resolved in layers (defaults ← file ← `<target>:` section ←
`--config` ← flags), not on its keys. Doing it alongside TASK-160's
`loadProject` step avoids touching every config read twice.

## Where config is declared today

| Place | What it holds |
| ----- | ------------- |
| `b-ber-lib/src/Config.ts` | `ConfigOptions` interface and the defaults |
| `b-ber-lib/src/Yaml.ts` | a separate `config` schema for validation |
| `b-ber-cli/src/lib/config-options.ts` | `withConfigOptions`, the flags `build` and `new` accept |
| the same file | `blacklistedConfigOptions`, keys the CLI refuses |

## Starting inventory (2026-11-20, from a grep; the audit confirms it)

| Key | Default | Read by | First observations |
| --- | ------- | ------- | ------------------ |
| `env` | `NODE_ENV` or `development` | lib (`state.env` reads `NODE_ENV` instead) | two sources of truth: `NODE_ENV`, which `build` also sets, and this key |
| `src` | `_project` | everything | |
| `dist` | `project` | everything | the real output is `${dist}-${target}`; `SpineItem` ignores it (TASK-153) |
| `cache` | `true` | reader manifest only | is it used by the reader? |
| `theme` | `b-ber-theme-serif` | lib | |
| `themes_directory` | `./themes` | lib | |
| `base_url` | `http://localhost:4000/project-web` | tasks (web) | four URL keys whose differences are hard to remember |
| `base_path` | `/` | tasks | |
| `remote_url` | `http://localhost:4000/` | lib, tasks | |
| `reader_url` | `http://localhost:4000/project-reader` | tasks (reader) | |
| `private` | `false` | tasks, templates | name doesn't say "noindex" |
| `ignore` | `[]` | tasks | |
| `layout` | `columns` | reader manifest | reader-only |
| `downloads` | `[]` | reader manifest | reader-only, CLI-blacklisted |
| `ui_options` | nested icons object | reader manifest (`uiOptions`) | reader-only, CLI-blacklisted, already camelCased in code |
| `autoprefixer_options` | browserslist | sass | CLI-blacklisted |
| `ibooks_specified_fonts` | `false` | opf | CLI comment says "always set to `true`" |
| `group_footnotes` | `true` | parser-footnotes | |
| `pdf_options` | (none) | pdf | **not declared** in Config or the schema |
| `uglify_options` | (none) | scripts | **not declared** |
| `builds` | (none) | deploy | **not declared** |
| `bucket_url` | (none) | deploy | CLI offers the flag, then rejects it (pinned "Defect" in the CLI tests) |
| `remote_javascripts`, `remote_stylesheets` | (none) | inject, read as `` remote_${type} `` | same as `bucket_url`; inject also mangles them (#803) |
| `epub:`, `web:`, … sections | | nothing | ignored since 2019 (TASK-153); TASK-160 restores them |

## Subtasks

- [ ] **Audit.** For every key: where it is read, what it does, whether
      anything uses it, and whether the reader (reader-react) reads it from
      the manifest. Record the result in Findings.
- [ ] **Propose the new key set** as a table: old key → new key (or
      removed, with why), camelCase. Group related settings, e.g. reader-only
      settings under `reader:`, the URLs under something like `urls:` or
      `publish:`, tool options under their tool. Decide which keys belong in
      a target's section rather than at the top level.
- [ ] **One schema** that produces the TypeScript type, the defaults,
      validation with clear messages (unknown key, wrong type), and the CLI
      flags. Delete the other three declarations.
- [ ] **Read-time migration** from old keys, with a warning per key naming
      the replacement. Tests for every mapping.
- [ ] Update the `bber new` template, the docs, and the kitchen-sink fixture
      (with the golden-output snapshot, if anything changes)
- [ ] Decide whether `metadata.yml`'s `term_property` / `term_property_value`
      follow the same camelCase rule (it is a different file, with Dublin
      Core terms), and record the decision

## Notes

- **The public surface.** Config keys are the user-facing API that every
  project touches, so names chosen here are a semver commitment.
- Related: TASK-160 (config layering, `loadProject`), #803 (inject remote
  URLs), TASK-153's per-build-config defect test.
- YAML I/O is due to be standardised separately (`YamlAdaptor` vs
  yawn-yaml). This task should not depend on yawn-yaml's comment
  preservation.

## Findings
