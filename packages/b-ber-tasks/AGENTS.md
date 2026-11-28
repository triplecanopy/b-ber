# AGENTS.md — b-ber-tasks

## What This Is

`b-ber-tasks` defines every individual build step in the b-ber pipeline, and how each target (EPUB, Mobi, PDF, web, reader, sample, XML) runs them. Each task is an async function of the build's context, `(ctx, inputs) → outputs` (TASK-165): it reads the project, the target and the config from the `BuildContext` b-ber-lib's `runBuild` creates, takes what earlier steps produced as arguments, and returns what later ones need. A target's build is a plain async function in `src/targets.ts` that runs its steps top to bottom. `b-ber-cli` calls `build(ctx)` for each target. The package also includes tasks for serving output locally via browser-sync, deploying to remote hosts, and generating the Lunr full-text search index.

The data flow between the steps:

```
render(ctx, { spine })                → { figures, footnotes, guide, remoteAssets }
loi(ctx, { figures, spine })          → { pages, guide }   (adds the figures titlepage to the spine)
footnotes(ctx, { footnotes, spine })  → the notes page     (adds it to the spine)
opf(ctx, { spine, toc, guide, loi, remoteAssets })
web(ctx, { spine, loi, toc }), xml(ctx, { spine, loi }), and the other packagers (ctx)
```

The spine is the context's (`ctx.settings.spine`), extended in place by loi
and footnotes and reordered by opf, because b-ber-lib and the templates still
read it through `State`.

## Key Files

| File                             | Purpose                                                               |
| -------------------------------- | --------------------------------------------------------------------- |
| `src/index.ts`                   | Re-exports all task functions, `build`, `step` and the target names   |
| `src/targets.ts`                 | Each target's build: its steps, in order, and what passes between them |
| `src/step.ts`                    | `step(ctx, name, fn)`: one step, between the logger's start and stop events |
| `src/context.ts`                 | What tasks read from the context: source and output paths, metadata, b-ber-lib's version |
| `src/render/index.ts`            | Converts Markdown source files to XHTML via `b-ber-markdown-renderer` |
| `src/opf/Opf.ts`                 | Generates the EPUB OPF package document                               |
| `src/opf/ManifestAndMetadata.ts` | Builds OPF manifest and Dublin Core metadata sections                 |
| `src/opf/Navigation.ts`          | Builds NCX / navigation document                                      |
| `src/container/`                 | Generates `META-INF/container.xml`                                    |
| `src/epub/`                      | Zips the OPS directory into a `.epub` file                            |
| `src/sass/`                      | Compiles SCSS to CSS with autoprefixer                                |
| `src/scripts/`                   | Bundles and minifies JavaScript assets                                |
| `src/copy/`                      | Copies static assets (images, fonts, media) into the build            |
| `src/cover/`                     | Generates the EPUB cover image entry                                  |
| `src/footnotes/`                 | Collects and renders footnote pages                                   |
| `src/loi/`                       | Generates the List of Illustrations page                              |
| `src/generate/`                  | Generates placeholder XHTML files for non-Markdown content            |
| `src/inject/`                    | Injects navigation and UI elements into rendered HTML                 |
| `src/init/`                      | Scaffolds a new b-ber project directory                               |
| `src/clean/`                     | Removes build output directories                                      |
| `src/mobi/`                      | Runs Calibre conversion to produce `.mobi`                            |
| `src/pdf/`                       | Produces PDF output                                                   |
| `src/web/`                       | Builds static website output including Lunr search index              |
| `src/reader/`                    | Builds reader-compatible output                                       |
| `src/xml/`                       | Builds InDesign XML output                                            |
| `src/sample/`                    | Builds sample (excerpt) output                                        |
| `src/serve/`                     | Starts a browser-sync dev server                                      |
| `src/deploy/`                    | Deploys build output to a remote host                                 |
| `src/validate/`                  | Validates directive syntax via `b-ber-validator`                      |

## Dev Commands

```bash
npm test      # jest
npm run build # compile src/ → dist/ with tsdown, then copy.sh for browser-side JS assets
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All tasks return Promises. Do not use callbacks.
- A build task takes the `BuildContext` as its first argument and never imports `State`. What it needs from an earlier step is an argument, and what a later step needs is its return value, passed on by the target's build in `src/targets.ts`. Library code the tasks call (b-ber-lib's utils, the templates, the grammars) still reads `State`, which routes to the same context while the build runs in it; that goes with TASK-173.
- No module-level mutable state and no instances created at import. Several targets will build at once in one process (TASK-166), and anything that outlives one call is shared between them.
- A new step goes in a target's build in `src/targets.ts` and in that target's `steps` list, which the logger counts; `__tests__/targets.test.js` checks the two agree.
- `init`, `generate` and `validate` are commands, not build steps: they run outside a build and still read the project through `State`.
- Some web-build files (`src/web/search.js`, `src/web/worker.js`, etc.) are excluded from tsdown compilation because they run in the browser; do not add ES module imports to those files.
- The `copy.sh` script copies non-JS source assets (e.g., web worker scripts) into `dist/` during build. If you add new non-JS files, update `copy.sh`.

## The sass task and theme customization

`src/sass/index.ts` builds the publication stylesheet. Every build sequence
(`epub`, `mobi`, `pdf`, `web`, `sample`, `reader`, `xml`) runs it. Its tests,
in `__tests__/sass.test.js`, compile real SCSS with the real dart-sass and
autoprefixer, so they show what each rule below does in practice. That file
declares `@jest-environment node`: the root Jest run uses jsdom, and from
inside jsdom's realm dart-sass cannot use Node's `fs`, so every `@import`
fails. Any new test that compiles SCSS needs the same docblock.

### What the task does, in order

Project paths below are relative to the source directory (`config.src`,
`_project/` by default); the output goes to the build's `OPS/stylesheets/`.

1. Creates `OPS/stylesheets/` in the build directory.
2. Copies everything except dotfiles in the theme's `fonts/` and `images/`
   (the directories beside the theme's `entry`) into the project's `_fonts/`
   and `_images/`. Files already in the project are not overwritten. The
   `copy` task later moves them into the build.
3. Concatenates up to three files into one string, each skipped if absent:
   1. `_stylesheets/<theme name>/_settings.scss`, the user's variables;
   2. the theme's `entry`, its `application.scss`;
   3. `_stylesheets/<theme name>/_overrides.scss`, the user's rules.

   If none of the three exists it reports that with `log.error` and throws,
   which rejects the task.
4. Prefixes `$build: "<target name>";` and compiles the string with dart-sass's
   legacy `render()` API. The output is `compressed` when
   `NODE_ENV=production`, `expanded` otherwise.
5. Runs autoprefixer through postcss with `config.autoprefixer_options`, or
   the default list (`defaults`, `> 1%`, `not dead`, `not IE 11`, with
   `flexbox: 'no-2009'`), read from the build's config when the task runs.
   They were read once, at import, until TASK-165.
6. Writes `application.css`, or `<ctx.hash>.css` in production.

dart-sass is given a `logger`, so nothing it prints reaches stderr directly. A
`@warn` in a stylesheet goes to `log.warn`; deprecation warnings, which come
from the bundled themes and which a project cannot act on, go to `log.info`
and show at `--verbose`.

### What that means for a theme or a project

- **Order sets precedence.** The user's settings come first, so they beat the
  theme's `!default` variables. The user's overrides come last, so they win
  the cascade and can use every variable and mixin the theme defined. An
  assignment in the theme *without* `!default` beats the user's settings:
  b-ber-theme-serif and b-ber-theme-sans both reset `$font-family-base` this
  way in the reader build.
- **`$build` is declared before anything else**, so user settings and the
  theme can both branch on it. Its value is the build name. A theme's own
  `$build: 'epub' !default` only matters when the theme is compiled outside
  b-ber. Inside `@if` in the user's settings, assign only variables already
  declared at the root: nothing else has run yet, and an assignment to an
  undeclared variable inside a block stays local to it.
- **Imports beginning with `~` name an npm package**, scoped or not. The
  importer resolves it with `require.resolve` starting from the theme's
  directory. A bare `~pkg` imports the package's `main`. `~pkg/some/file`
  imports `some/file` inside the package directory. Any package works, not
  only `@canopycanopycanopy/*`. Other imports are passed through unchanged.
- **The load paths are `_stylesheets/`, the theme's directory, and its parent
  directory, in that order.** The theme entry is compiled as part of a string,
  not from its own file, so its relative imports are looked up on these paths.
  Because `_stylesheets/` comes first, a project partial there shadows a theme
  partial of the same name: `_stylesheets/_settings.scss` replaces the
  theme's own `@import 'settings'`. User files in `_stylesheets/<theme name>/`
  can import partials from `_stylesheets/` by name.
- **Only the selected theme's directory is read.** Files in
  `_stylesheets/<another theme>/` are ignored.

### How a project gets its theme

The task reads the theme from the context, `ctx.project.theme`, which
`loadProject` reads from `config.theme` (`readTheme` in b-ber-lib's
`Project.ts`). Built-in names map to the two theme packages. Any other name is
`require`d, from the project's `themes/` directory (`config.themes_directory`)
or `node_modules`. If that fails, b-ber warns and falls back to
b-ber-theme-serif. A theme module exports `{ name, entry, fonts, images,
npmPackage }`; this task uses only `name` and `entry`.

`bber theme set <name>` (`Theme.set` in b-ber-lib) creates
`_stylesheets/<name>/`, copies the theme's `_settings.scss` there, creates an
empty `_overrides.scss`, copies the theme's listed `fonts` and `images` into
the project, and writes `theme: <name>` to `config.yml`. It overwrites none
of those files if they already exist. The copied `_settings.scss` still
carries the theme's `!default` flags; they do not stop it overriding the
theme, because it is compiled first.

### Known defects

- A compile error, including an import that cannot be resolved, is thrown
  from inside dart-sass's callback (`if (err) throw err`). It never reaches
  the task's `.catch`: the task's Promise never settles. The CLI's
  uncaught-exception handler prints it and exits 1; any other caller waits
  forever (#773).
- The importer finds the package directory with the *first* occurrence of the
  package name in the resolved path. If a directory above `node_modules`
  contains that name, for example a project in `~/b-ber-theme-mixins-demo/`,
  the import resolves to the wrong place (#774).
- `errLogToConsole` is a node-sass option that dart-sass ignores (#746).
