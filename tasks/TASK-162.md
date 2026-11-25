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

Kept as the historical record. The audit in Findings (2026-11-24) confirms
or corrects every row; the corrections are listed there.

## Plan (filed 2026-11-25)

Each is an issue under #792. Together with TASK-160's tasks:

| Task | | Lands |
| ---- | - | ----- |
| TASK-180 (#844) | one schema; typed, resolved config; the renamed keys' consumers; audit bugs 3, 4, 8, 9 | with TASK-181. Needs TASK-163 |
| TASK-181 (#845) | read-time migration from the old keys | with TASK-180 |
| TASK-182 (#846) | one `url`, per-target URLs derived from it; bugs 5, 6 | 5.0, with TASK-169 |
| TASK-183 (#847) | remove the dropped keys and their code; settles #803 | with TASK-181 |
| TASK-184 (#848) | a minimal `bber new` config; its `--src`/`--theme` (bug 2); docs and fixture | after TASK-180 |
| TASK-185 (#850) | camelCase keys in `metadata.yml` and the navigation files (decision 12) | with TASK-181 |

Audit bug 1 (path flags applied too late) is TASK-163's, and bug 7 (`deploy`
ignores `dist`) is TASK-169's. The `<target>.yml` fold, with its migration,
is TASK-172.

## Subtasks

- [x] **Audit.** For every key: where it is read, what it does, whether
      anything uses it, and whether the reader (reader-react) reads it from
      the manifest. Record the result in Findings.
- [x] **Propose the new key set** as a table: old key → new key (or
      removed, with why), camelCase. Group related settings, e.g. reader-only
      settings under `reader:`, the URLs under something like `urls:` or
      `publish:`, tool options under their tool. Decide which keys belong in
      a target's section rather than at the top level.
- [x] File the implementation tasks (2026-11-25; see "Plan"): the schema,
      the read-time migration, the URL key, removing the dropped keys, and
      `bber new`, the docs and the fixture
- [x] Decide whether `metadata.yml`'s `term_property` / `term_property_value`
      follow the same camelCase rule (it is a different file, with Dublin
      Core terms), and record the decision. Decided 2026-11-25: yes, and so
      does the navigation files' `in_toc` (decision 12); TASK-185

## Notes

- **The public surface.** Config keys are the user-facing API that every
  project touches, so names chosen here are a semver commitment.
- Related: TASK-160 (config layering, `loadProject`), #803 (inject remote
  URLs), TASK-153's per-build-config defect test.
- YAML I/O is due to be standardised separately (`YamlAdaptor` vs
  yawn-yaml). This task should not depend on yawn-yaml's comment
  preservation.

## Findings

### 2026-11-24: config key audit

At commit `72066c35` (`main`). Line numbers below are at that commit; paths
are under `packages/b-ber-`.

**Method.** Grepped every package's `src/` for `state.config.<key>`,
`state.config[...]`, destructuring from `state.config` and
`getProjectConfig()`, string paths (`state.update('config.x')`,
`state.has('config.x')`), the computed `` `remote_${type}` `` read, raw reads
of `config.yml` that bypass `State`, and each key name as a bare word. Read the
four declarations, the CLI's handling of flags, the reader manifest writer and
everything in `b-ber-reader-react/src` that consumes it. Collected the
`config.yml` of every real project: the one `bber new` scaffolds (run, not
read), `demos/basic`, and the kitchen-sink fixture. Where a key's effect was
unclear, built a copy of kitchen-sink with the key or flag changed (`bber
build epub --no-compile`) and compared the output, and read the reader values
from the golden snapshot (`b-ber-testing/tests/cli/__golden__/reader/`).

**Summary.** 24 keys. 18 are declared in `Config.ts`, 3 more only as CLI
flags, and 3 nowhere.

| | Keys | Count |
| --- | --- | --- |
| declared and used | `src`, `dist`, `theme`, `themes_directory`, `base_url`, `remote_url`, `reader_url`, `private`, `ignore`, `layout`, `downloads`, `ui_options`, `autoprefixer_options`, `ibooks_specified_fonts`, `group_footnotes` | 15 |
| declared, read, no effect | `cache`, `base_path`: passed to the reader, which ignores them | 2 |
| declared, never read | `env` | 1 |
| undeclared in `Config.ts`, read | `pdf_options`, `uglify_options`, `bucket_url`, `remote_javascripts`, `remote_stylesheets` | 5 |
| neither declared nor read | `builds` (set by both the demo and the fixture) | 1 |

Dead: `env`, `cache`, `base_path`, `builds`, and the `<target>:` sections
(loaded, never applied, TASK-153). `remote_javascripts`/`remote_stylesheets`
are read but produce broken links (#803), so no working project relies on
them.

**What real projects set.** `bber new` writes a dump of every default
(`templates/src/Project/index.ts:41`, `{ ...state.config, ...overrides }`), so
every scaffolded project carries all 18 declared keys, the dead ones included,
and `env:` holds whatever `NODE_ENV` was at scaffold time. `demos/basic` and
kitchen-sink are older dumps: they set `env`, `src`, `dist` (kitchen-sink:
`_builds`), `ibooks_specified_fonts`, `theme`, `themes_directory`, `base_url:
/`, `base_path`, `remote_url`, `reader_url`, `builds`, `ui_options` (the
defaults), `private` and `ignore: []`; the demo also sets
`autoprefixer_options` with autoprefixer's obsolete `browsers` option. Neither
sets `cache`, `layout`, `downloads`, `group_footnotes`, `pdf_options`,
`uglify_options`, `bucket_url` or the remote lists to anything but a default.
Kitchen-sink also has `epub.yml`, `reader.yml` and `web.yml` navigation
overrides.

#### Per-key table

Declared: **C** `lib/src/Config.ts`, **Y** the `lib/src/Yaml.ts` schema,
**F** a flag in `cli/src/lib/config-options.ts`, **B** in
`blacklistedConfigOptions`.

| Key | Default | Declared | Read at | What it does | Verdict |
| --- | ------- | -------- | ------- | ------------ | ------- |
| `env` | `NODE_ENV` or `development` | C Y F | nowhere. `state.env` reads `process.env.NODE_ENV` (`lib/src/State.ts:247`); only its setter writes `config.env` (`:252`) | nothing. `--env production` logs "Applying configuration option [env]" and still builds unminified `application.css` (verified); `NODE_ENV=production` gives `<hash>.css`. The real switch is `NODE_ENV`, read by `sass/index.ts:197,215`, `scripts/index.ts:63`, `reader/index.ts:60` | **dead** |
| `src` | `_project` | C Y(required) F | `State` path helpers and loaders (`State.ts:228,392,400,464,478`), `Theme.ts:90`, everything through `state.src.*` | the source directory | used. `serve` (`serve/index.ts:38-40`), `init` (`init/index.ts:24`) and `lib/src/utils/index.ts:131` hardcode `_project` |
| `dist` | `project` | C Y(required) F | `State.ts:479,503` → `builds[t].dist = <dist>-<t>`; everything through `state.dist.*` | prefix of each target's output directory | used. `SpineItem.ts:69` (#757), `serve/index.ts:71` and `deploy/index.ts:14-15` hardcode `project-` |
| `cache` | `true` | C F | `reader/index.ts:252` → `__SERVER_DATA__.cache` → `Reader/index.tsx:78` → `Reader/loader.ts:105,113` → `parseSpineItemResponse`, where the destructure is commented out (`helpers/XMLAdaptor.ts:341`) | nothing. Not in `books.json`; the Yaml schema omits it | **dead** |
| `theme` | `b-ber-theme-serif` | C Y F | `State.ts:436` (once, at import), `Theme.ts:80`, `init/index.ts:72`; written by `bber theme set` (`Theme.ts:136`) | which theme module is loaded | used. The `--theme` flag has no effect (bug 1) |
| `themes_directory` | `./themes` | C Y F | `State.ts:415` (at import; also `ensureDirSync`s it), `Theme.ts:40` | adds a directory to `module.paths` for `require(theme)`; listed by `bber theme list` | used; every project leaves the default |
| `base_url` | `http://localhost:4000/project-web` | C Y F | `web/index.ts:91` → `BASE_URL`, prefixed to the web build's TOC, prev/next, worker and index links (`:171-225,326,371,405`); `serve/index.ts:16` forces `/` | the web build's public URL | used. The default embeds the default `dist` plus `-web`; both projects set `/` |
| `base_path` | `/` | C Y F | `reader/index.ts:247` → `__SERVER_DATA__.basePath`; `serve/index.ts:17` | nothing. `b-ber-reader-react/src` never reads `basePath` from its settings (the name appears only as a parameter in `helpers/Request.ts:30`); it is listed in the public `index.d.ts:185` | **dead** |
| `remote_url` | `http://localhost:4000/` | C Y F | `reader/index.ts:58-70` (must be `http…` when `NODE_ENV=production`), `:169-173` (`books.json` `url`, `cover`), `:244` (`projectURL`); `lib/src/utils/index.ts:237,279` (base and self link of the webpub manifest, web and reader); `serve/index.ts:18` | the reader's "project" URL: where it fetches `api/books.json` (`App.tsx:93`); and the base of both webpub manifests | used, but in practice has to equal `reader_url` (bug 5) |
| `reader_url` | `http://localhost:4000/project-reader` | C Y F | `reader/index.ts:201,230,286` (manifest `<link>`, `bookURL`, every `src`/`href` in `index.html`); `:273` is in a method whose call is commented out (`:49`); `serve/index.ts:19` | the reader build's public URL | used. The default embeds `project-reader` |
| `downloads` | `[]` | C Y B | `reader/index.ts:176` (`books.json`), `:246` (`__SERVER_DATA__`) | the reader's downloads sidebar, `{ url, label, description? }[]` (`Sidebar/SidebarDownloads.tsx:9-13`); its button shows only when the list is non-empty (`Navigation/NavigationHeader.tsx:101`) | used (reader). No project sets it |
| `ui_options` | `navigation.header_icons.{info,home,downloads,toc}`, `navigation.footer_icons.{chapter,page}`, all `true` | C Y B | `reader/index.ts:176` (`books.json`, as `ui_options`), `:251` (`__SERVER_DATA__`, as `uiOptions`); reader: `App.tsx:119`, `NavigationHeader.tsx:56`, `NavigationFooter.tsx:51,65,73,81` | shows or hides the reader's six buttons. The nested keys stay snake_case inside the reader | used (reader). `header_icons.downloads` is redundant with an empty `downloads` |
| `private` | `false` | C Y F | `web/index.ts:400` (the web `index.html`); `templates/src/Xhtml/index.ts:9` through `inject/index.ts:91`, so every XHTML page of **every** target | `<meta name="robots" content="noindex,nofollow">` | used. It also lands in EPUB pages (verified: 25 files in kitchen-sink's epub) |
| `ignore` | `[]` | C Y F | `copy/index.ts:12-44` | skips files or directories, resolved from the cwd, when copying `_images`, `_fonts` and `_media` into the build | used, but narrower than its flag says ("files or folders to ignore during the build": Markdown is never skipped). No project sets it |
| `autoprefixer_options` | `{ overrideBrowserslist: [defaults, '> 1%', not dead, not IE 11], flexbox: no-2009 }` | C Y B | `sass/index.ts:33`, once, at import | passed to autoprefixer | used. The fallback at `sass/index.ts:33-36` duplicates the default and can't be reached. See bug 3 for the merge |
| `layout` | `columns` | C Y | `reader/index.ts:176,253`; reader `App.tsx:117,125-126` (`__SERVER_DATA__` wins over `books.json`) | `columns` or `scroll` (`constants/index.ts:16`) | used (reader). It has no flag, but `--layout` is accepted (yargs is not strict, and `state.has` passes) |
| `ibooks_specified_fonts` | `false` | C Y B | `opf/ManifestAndMetadata.ts:48-58` | writes `<meta property="ibooks:specified-fonts">` true or false into every OPF (verified both ways) | used. The CLI's comment "always set to `true`" (`config-options.ts:2`) is wrong: it defaults to `false` |
| `group_footnotes` | `true` | C Y | `parser-footnotes/src/index.ts:74-77,102` | `true`: each document's notes number from 1. `false`: one sequence across the book, kept in the module-level `Counter` (`:23`), which TASK-160 found leaks between concurrent targets | used. No project sets it, and kitchen-sink has one footnote, so only unit tests exercise `false` |
| `pdf_options` | (none) | — | `pdf/index.ts:141` | a map of Calibre `ebook-convert` options, filtered by a whitelist and turned into `--kebab-case` flags (`:20-134`) | used (pdf). Undeclared, so `--config` and flags can't set it |
| `uglify_options` | (none) | — | `scripts/index.ts:7`, once, at import | uglify-js options for the production bundle | used. Undeclared; no project sets it |
| `builds` | (none) | — | nowhere. `deploy` takes its builds from the `bber deploy [builds...]` positional (`deploy/index.ts:150-158`, `cli/src/commands/deploy.ts:6`) | nothing | **dead**. The starting inventory's "read by deploy" is wrong |
| `bucket_url` | (none) | F | `deploy/index.ts:137-139`, read from `config.yml` with `YamlAdaptor`, not from `State` | the S3 destination | used (deploy). The `build`/`new` flag could never reach it: `bber deploy` takes no config flags, and deploy reads the file |
| `remote_javascripts`, `remote_stylesheets` | (none) | F | `inject/index.ts:14` (`` state.config[`remote_${type}`] ``), joined onto the local directory at `:58,73` | meant to link remote assets on every page; produces `../stylesheets/https:/…` (#803) | read, broken |
| `epub:`, `web:`, … sections | | — | `State.ts:497-499` copies them into `builds[t].config`; nothing reads that | nothing (TASK-153's defect test; verified again: `epub: { private: true }` leaves the epub's pages indexable) | **dead** until TASK-160 |

#### Keys and inputs the grep missed

- **`<target>.yml`** navigation overrides, found by filename
  (`State.ts:488-492`). Not a key today; TASK-160 folds them into the
  `<target>:` section.
- **`compile`**, a phantom key. `--no-compile` is read straight from
  `process.argv` (`epub/index.ts:7`, `mobi/index.ts:19`, `pdf/index.ts:152`) and
  never declared to yargs, so `build.ts:58` warns "Invalid configuration option
  [compile]" on every build that uses it (verified).
- **`NODE_ENV`** and **`BBER_BUCKET_REGION`** (read with the AWS credentials,
  `deploy/index.ts:128`) are environment inputs that do the jobs of `env` and
  of a deploy region key.
- **Reader values that do not come from config**: `loadRemoteLibrary: false`
  is hardcoded (`reader/index.ts:250`); `books` and `bookURL` are derived.
- **Writers of `config.yml`**: `bber new` (the full dump) and `bber theme set`
  (`Theme.ts:131-139`, through `YamlAdaptor`). `State` reads the file with
  yawn-yaml (`Yaml.ts`), but deploy and `theme set` use `YamlAdaptor`: two
  parsers that disagree on YAML 1.1 numbers (b-ber-lib AGENTS.md).
- `--summary` prints every string value in `state.config`
  (`logger/src/format.ts:157`).

#### Corrections to the starting inventory

| Row | Correction |
| --- | --- |
| `env` | not "two sources of truth": `config.env` is never read at all |
| `cache` | reaches the reader through `__SERVER_DATA__`, not `books.json`, and the reader ignores it |
| `base_path` | dead: the reader never reads `basePath` |
| `ibooks_specified_fonts` | defaults to `false` and works; the CLI comment is wrong |
| `builds` | read by nothing, deploy included |
| `bucket_url` | deploy reads it from the file and bypasses `State`, so even an accepted flag could not reach it |
| `theme` | read by lib and tasks (`init`), and written by `bber theme set`; not lib only |
| `layout`, `downloads`, `ui_options` | each reaches the reader twice, in `books.json` and in `__SERVER_DATA__` (bug 5) |

#### Declaration disagreements

- **`Yaml.ts`'s `config` schema is never applied to `config.yml`.** `typeCheck`
  sees data only from `add` (`Yaml.ts:110-113`). The constructor checks only
  that the schema name exists (`:99-103`), and `load` validates nothing
  (`:105-108`). Its `required: true` on `src`/`dist` and its "TODO: fill this
  in" have no effect. It also omits `cache`.
- **CLI flags with no `Config.ts` key** (`bucket_url`, `remote_javascripts`,
  `remote_stylesheets`) are rejected by `state.has` unless the project's
  `config.yml` already sets them (pinned "Defect",
  `cli/__tests__/commands/build.handler.test.js:297`).
- **Keys with no flag** (`layout`, `group_footnotes`) are accepted as flags
  anyway, because the check is `state.has`, not the flag list.
- **The CLI's descriptions are wrong or confusing**: `base_path` is "appended
  to the URL for the reader build" (nothing appends it); `remote_url` is the
  "URL at which the reader build will be made public" and `reader_url` the "URL
  that hosts the assets for the reader reader build"; `ignore` overstates what
  it skips.
- **Defaults declared twice**: autoprefixer's in `Config.ts:58-61` and
  `sass/index.ts:33-36`; `src`/`dist` in `Config.ts:31-32` and
  `init/index.ts:24-25`; the reader's `uiOptions` in `Config.ts:42-55` and
  `reader-react/src/store/initialState.ts:22-27`; `layout` in `Config.ts:62`
  and `App.tsx:126`.
- **Defaults that encode another key's default**: `base_url` and `reader_url`
  embed `project-web`/`project-reader`, so changing `dist` leaves them pointing
  at the old directories.

#### Bugs found (recorded only; nothing is fixed here)

1. **Most path-like CLI flags do nothing.** `State`'s constructor loads
   metadata, media, the builds (with `dist` baked into `builds[t].dist`) and the
   theme once, at import (`State.ts:303-307`, `:503`). `reset()` re-reads only
   `config.yml` (`:310-312`). `build.ts:57-71` applies flags after all that.
   Verified on kitchen-sink: `--theme b-ber-theme-sans` and `--dist other` log
   "Applying configuration option" and change nothing, while `theme:
   b-ber-theme-sans` in `config.yml` does change the CSS. `--src content` fails
   the build: `build.ts:78-81` creates `_javascripts` under `config.yml`'s
   `src` before the flag applies, and `scripts` then reads the flag's. From
   the code, `--themes_directory` arrives too late for the same reason. Of the
   15 advertised flags, 5 work (`base_url`, `remote_url`, `reader_url`,
   `private`, `ignore`), 3 are rejected, 2 set dead keys (`cache`,
   `base_path`), and `env`, `theme`, `themes_directory`, `dist` and `src` are
   ignored or break the build.
2. **`bber new` ignores two of its own overrides.** `--src content` writes
   `src: content` but scaffolds `_project/` (`init/index.ts:24`), so the new
   project cannot build. `--theme b-ber-theme-sans` writes `sans`, then
   `setTheme` reads `state.config.theme`, the default (`init/index.ts:72`), and
   rewrites `config.yml` to `serif`. Both verified.
3. **`defaultsDeep` merges arrays by index** (`Config.ts:72`). A project's
   `overrideBrowserslist: ['last 1 chrome version']` becomes `['last 1 chrome
   version', '> 1%', 'not dead', 'not IE 11']` (verified with lodash). The
   demo's `autoprefixer_options.browsers` is ignored outright: autoprefixer
   10.7 prefers the merged-in default `overrideBrowserslist`.
4. **Options read at import**: `autoprefixer_options` (`sass/index.ts:33`) and
   `uglify_options` (`scripts/index.ts:7`). No later layer can reach them:
   not `--config`, and not a `<target>:` section. TASK-160's layering needs
   them read inside the task.
5. **The reader's two channels disagree.** `books.json` builds `url`/`cover`
   from `remote_url` (`reader/index.ts:169-173`), while `__SERVER_DATA__.bookURL`
   uses `reader_url` (`:233`). The reader fetches `<projectURL>/api/books.json`
   (`App.tsx:93`, where `projectURL` is `remote_url`), but the file is written
   into the reader's own directory. With kitchen-sink's values the request goes
   to `http://localhost:4000/api/books.json` and misses, and the reader runs on
   `__SERVER_DATA__`, which carries the same `downloads`/`uiOptions`/`layout`.
   So `books.json` is found only when `remote_url` equals `reader_url`, and for
   a b-ber build it is redundant.
6. **The dist directory's name leaks into public URLs.** Each webpub
   manifest's self link is `<remote_url>/<distDir>/manifest.json`
   (`lib/src/utils/index.ts:279`), e.g.
   `http://localhost:4000/_builds-reader/manifest.json`. The reader manifest's
   hrefs also contain the build machine's absolute path (known: TASK-152
   normalises it to `{fixture}`).
7. **`deploy` ignores `dist`.** It uploads `project-reader/*`, `project-web/*`,
   `*.epub` and the rest from the project root (`deploy/index.ts:9-16`), so
   kitchen-sink's reader (`_builds-reader`) would deploy nothing.
8. **`private` marks EPUB pages** with a robots meta, which means nothing in an
   EPUB (`templates/src/Xhtml/index.ts:9`, applied to every target by
   `inject`).
9. `--no-compile` warns "Invalid configuration option [compile]" (above).

### Proposed key set

**Decided** (2026-11-25), after checking every "no project uses it" against
the 262 b-ber projects in the GitLab group (see "2026-11-25: checked against
the GitLab projects" below). It sits under Findings because it follows from
the audit, and moves to a Design section when the schema subtask starts. The
bias is toward removal: 24 keys become 12, plus the `<target>:` sections
TASK-160 restores.

**Shape.** Three kinds of key:

- **Shared**: valid at the top level and in any `<target>:` section, which
  overrides it for that target (TASK-160's layering).
- **Target-only**: meaningful to one target, so valid only in that target's
  section (`reader.layout`). Reader settings and tool options go here, rather
  than into new `reader:`/`urls:` groups beside the target sections.
- **`deploy:`**, the one group that is not a target, because deploy is a
  command. TASK-160's later pluggable deployer would extend it.

```yaml
src: _project
dist: dist
theme: b-ber-theme-serif
url: https://example.com/my-book/   # where dist/ is published
noindex: false
navigation: toc.yml
footnotes: { numbering: document }   # or book: one sequence across the book

reader:
  layout: columns
  downloads: []
  controls: { home: true, toc: true, info: true, chapter: true, page: true }

pdf:
  calibre: { paperSize: a4 }

web:
  navigation: web.yml           # replaces _project/web.yml

deploy:
  bucket: s3://bucket/my-book
```

**URLs: four keys become one.** Under TASK-160's layout, `dist/` is deployed
as a whole and each target lives at `dist/<target>/`. So a target's public URL
defaults to `<url>/<target>/`, and `<target>.url` overrides it, e.g. for a
reader hosted elsewhere. `base_url` becomes `web.url` and `reader_url` becomes
`reader.url`. `remote_url` folds into `reader.url`: bug 5 shows it has to equal
the reader's URL for `books.json` to be found, and its other use, the webpub
manifest's base, is the target's own URL. `base_path` is dead. `serve` keeps
overriding the URLs with the server's own, as it does today.

| Old key | New key | Why |
| ------- | ------- | --- |
| **Paths and theme** | | |
| `src` | `src` | unchanged and still configurable. All 263 GitLab projects use `_project` |
| `dist` | `dist`, default **`dist`** | it becomes the parent of `<target>/` (TASK-160), not a prefix, and `project/epub/…` reads badly. `dist` matches the JS toolchain. The migration warns that output has moved. All 263 GitLab projects set `dist: project` explicitly, so the new default changes none of them |
| `theme` | `theme` | unchanged |
| `themes_directory` | **removed**; fixed at `themes/` | `--themes_directory` never worked (bug 1). One GitLab project sets the key and depends on it: `tc-bber-theme` (`./my-themes`, which holds its theme). It renames that directory to `themes/`; the migration's warning says so |
| **Publishing** | | |
| (new) | `url` | the root that the target URLs derive from |
| `base_url` | `web.url` (derived from `url`) | one URL per target, under one root |
| `reader_url` | `reader.url` (derived from `url`) | |
| `remote_url` | **removed** → `reader.url` | it must equal `reader_url` in practice (bug 5). Migration: if the two differ, warn and use `reader_url` |
| `base_path` | **removed** | dead: the reader never reads `basePath` |
| `private` | `noindex` | the name says what it does. Shared, so `web: { noindex: true }` works. It should stop writing robots meta into EPUB targets (bug 8) |
| **Reader (target-only, in `reader:`)** | | |
| `layout` | `reader.layout` | `columns` or `scroll` |
| `downloads` | `reader.downloads` | `{ url, label, description? }[]` |
| `ui_options` | `reader.controls: { home, toc, info, chapter, page }` | flat booleans: the header/footer nesting is the reader's layout, not the author's concern. `header_icons.downloads` goes, because the button already hides when `downloads` is empty. The manifest writer maps back to reader-react's `uiOptions.navigation.*_icons` prop, which is reader-react's own public API (`index.d.ts`) and is not changed here |
| `cache` | **removed** | dead in the reader (`XMLAdaptor.ts:341`) |
| **EPUB** | | |
| `ibooks_specified_fonts` | **removed**; the OPF always writes `ibooks:specified-fonts` `true` | 212 of the 263 GitLab projects set `true`, including every project active since 2024. The 51 `false` values are tests and books from 2022 or earlier. The bundled themes embed fonts, which Apple Books otherwise replaces. The migration warns a project that sets `false` |
| **Tool options** | | |
| `pdf_options` | `pdf.calibre` | Calibre's option names in camelCase (`paperSize`); `kebabCase` already produces the flag. The whitelist needs re-keying |
| `autoprefixer_options` | **removed** | honour the project's browserslist config (`.browserslistrc` or `package.json`, the standard place), keeping b-ber's default list when there is none; `flexbox: no-2009` stays internal. This also removes bug 3's merge trap. No GitLab project has a custom list: 169 set `browsers` (which current Autoprefixer ignores) and 21 `overrideBrowserslist`, all to the same scaffolded value |
| `uglify_options` | **removed** | an internal tool's settings; no project sets it, and the minifier is an implementation detail |
| **Rendering** | | |
| `group_footnotes` | `footnotes.numbering: document \| book` (default `document`; `book` is today's `false`) | **kept**: 5 published books set `false` (i28 and i29), and 4 of them have notes in several documents, so they rely on one sequence across the book. The `Counter` that holds that sequence moves onto the build context before targets run concurrently (TASK-160 Plan step 4) |
| `ignore` | **removed** | it only filters the three asset directories, and its description overstates it. One GitLab project sets it (`a-heavy-nonpresence`: `./transcriptions/`), and it has no effect there: no such directory exists |
| **Navigation** | | |
| `<target>.yml` files | `navigation` (shared, default `toc.yml`) | TASK-160's fold, set per target as `epub: { navigation: epub.yml }`. Migration: a `<target>.yml` with no `navigation` key is mapped, with a warning. 128 GitLab projects have such files. Most are copies of `toc.yml` that an older `bber new` scaffolded, but 62 `reader.yml`, 17 `mobi.yml` and 12 `epub.yml` really differ, so the mapping matters |
| **Deploy** | | |
| `bucket_url` | `deploy.bucket` | read from the resolved config, not the raw file. The region stays in `BBER_BUCKET_REGION`, beside the credentials |
| `builds` | **removed** | dead; `bber deploy <targets…>` already chooses. 59 GitLab projects set it, mostly to an old download-list format from 2018–19 |
| **Removed outright** | | |
| `env` | **removed** | dead; `NODE_ENV` is what every task reads |
| `remote_javascripts`, `remote_stylesheets` | **removed** | broken today (#803), and no GitLab project sets them. Removing them settles #803 |
| `epub:`, `web:`, … | kept, and now applied | TASK-160. No GitLab project has one, so applying them changes no existing output |

Not keys: `--concurrency` (CLI only, TASK-160), `TargetFeatures` (internal),
and `--config` (a flag that names a layer).

**Notes for the later subtasks.**

- **Stop dumping the defaults into new projects.** `bber new` should write only
  what an author is expected to edit (`url`, `theme`, the navigation).
  Today every scaffolded project pins every default, so a changed default never
  reaches it, and the read-time migration would warn about up to 18 keys in
  each one. The removed keys could share one warning ("remove these: env,
  cache, base_path").
- **Flags.** 10 of today's 15 flags are rejected, set dead keys, or are
  ignored, so dropping most of them costs little. The ones worth keeping
  should come from the schema, and must apply before anything reads config
  (TASK-160's `loadProject` fixes that ordering).
- Validation should reject a target-only key at the top level, or in the
  wrong target's section, with a message naming where it belongs.

**Decisions** (2026-11-25):

1. `group_footnotes`: **kept**, as `footnotes.numbering: document | book`.
   Five published books use `false`.
2. `ignore`: **removed**. Its one use has no effect.
3. `themes_directory`: **removed**, fixed at `themes/`. `tc-bber-theme`
   renames `my-themes/`.
4. `ibooks_specified_fonts`: **removed**; always `true`.
5. Autoprefixer: **the project's browserslist config**, falling back to
   b-ber's list.
6. `src`: **kept** configurable.
7. Remote scripts and stylesheets: **removed**, which settles #803.
8. The `dist` default: **`dist`**.
9. The `url` default: **`/`**. The reader's check for an absolute `http` URL
   in production stays.
10. `deploy.targets`: **not added**. `bber deploy` keeps taking targets from
    the command line.
11. `books.json` and `__SERVER_DATA__`: **out of scope** here. It is a
    reader-react question, filed as TASK-186 (#851) under Reader quality
    (#713).
12. **Every key a project writes is camelCase: one format.** Where something
    downstream needs another form, the app converts it. Besides `config.yml`
    this covers `metadata.yml` (`term_property`, `term_property_value`: 106
    GitLab projects) and the navigation files (`in_toc`: 250 projects). The
    `term` values are Dublin Core terms, not keys, and don't change. Both
    forms are read for at least one major release, with one warning per file.
    Filed as TASK-185 (#850).

### 2026-11-25: checked against the GitLab projects

The audit's "no project uses it" covered only the projects in this repo: the
`bber new` template, `demos/` and the test fixtures. So each was rechecked
against shallow clones of all 290 non-empty repos in the canopycanopycanopy
GitLab group (`gitlab-projects/` beside the b-ber checkout). 263 have a
`config.yml`, and 262 are b-ber projects. The survey is read-only
(`gitlab-projects/_survey/survey.js`, results in `survey.json`). It compares
each value with `Config.ts`'s default, so the defaults that `bber new` writes
into every project don't count as uses.

| Key | Set to a non-default value | Verdict |
| --- | -------------------------- | ------- |
| `group_footnotes` | `false` in 5: `i28-goldin-senneby-essay`, `i29-jeremy-toussaint-baptiste`, `i29-malm`, `i29-pires`, `the-great-equalizer` | used; kept |
| `ignore` | 1: `a-heavy-nonpresence`, `["./transcriptions/"]`, which matches nothing | inert; removed |
| `themes_directory` | 1: `tc-bber-theme`, `./my-themes`, which holds its theme | used; removed, with that repo renaming the directory |
| `ibooks_specified_fonts` | `true` in 212 (the default is `false`) | the real default; removed, always `true` |
| `src` | none | |
| `remote_javascripts`, `remote_stylesheets` | none | |
| `autoprefixer_options` | none custom (two scaffolded values) | |
| `<target>:` sections | none | |
| `<target>.yml` files | 128 projects; 62 `reader.yml` differ from `toc.yml` | migration needed |

Keys no declaration knows: `baseurl` and `web_url`, once each, presumably
typos. Validation of unknown keys (the schema subtask) will name them.

A `config.yml` in `b-ber-template-new` does not parse (bad indentation at
line 8).
