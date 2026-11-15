# AGENTS.md — b-ber-tasks

## What This Is

`b-ber-tasks` defines every individual build step in the b-ber pipeline. Each task is an async function (Promise-based) that reads from and writes to the shared `State` singleton in `b-ber-lib`. `b-ber-cli` composes these tasks into ordered sequences to produce EPUB, Mobi, PDF, web, reader, and XML builds. The package also includes tasks for serving output locally via browser-sync, deploying to remote hosts, and generating the Lunr full-text search index.

## Key Files

| File                             | Purpose                                                               |
| -------------------------------- | --------------------------------------------------------------------- |
| `src/index.ts`                   | Re-exports all task functions                                         |
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
| `src/serialize.ts`               | Serialises the spine/TOC data structure                               |

## Dev Commands

```bash
npm test      # jest
npm run build # compile src/ → dist/ with tsdown, then copy.sh for browser-side JS assets
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All tasks return Promises. Do not use callbacks.
- Tasks operate on the shared `state` singleton from `b-ber-lib/State`. Do not pass state as an argument.
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
   (the directories beside `state.theme.entry`) into the project's `_fonts/`
   and `_images/`. Files already in the project are not overwritten. The
   `copy` task later moves them into the build.
3. Concatenates up to three files into one string, each skipped if absent:
   1. `_stylesheets/<theme name>/_settings.scss`, the user's variables;
   2. `state.theme.entry`, the theme's `application.scss`;
   3. `_stylesheets/<theme name>/_overrides.scss`, the user's rules.

   If none of the three exists it calls `log.error`, which exits.
4. Prefixes `$build: "<state.build>";` and compiles the string with dart-sass's
   legacy `render()` API. The output is `compressed` when
   `NODE_ENV=production`, `expanded` otherwise.
5. Runs autoprefixer through postcss with `config.autoprefixer_options`, or
   the default list (`defaults`, `> 1%`, `not dead`, `not IE 11`, with
   `flexbox: 'no-2009'`). The options are read once, when the module is first
   imported.
6. Writes `application.css`, or `<state.hash>.css` in production.

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

`state.theme` is loaded from `config.theme` (`State.loadTheme` in
b-ber-lib). Built-in names map to the two theme packages. Any other name is
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
  `.catch(log.error)`: the task's Promise never settles, and the CLI dies with
  an uncaught exception and Node's raw stack trace.
- The importer finds the package directory with the *first* occurrence of the
  package name in the resolved path. If a directory above `node_modules`
  contains that name, for example a project in `~/b-ber-theme-mixins-demo/`,
  the import resolves to the wrong place.
- `errLogToConsole` is a node-sass option that dart-sass ignores (#746).
