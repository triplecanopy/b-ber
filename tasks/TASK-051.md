# TASK-051: Theme customization documentation and SCSS compilation test coverage

**Epic:** Unit test coverage
**GitHub Issue:** #518 — https://github.com/triplecanopy/b-ber/issues/518
**Scope:** monorepo

## Description

Document the b-ber theme customization mechanism and add tests that verify the
SCSS compilation pipeline in `b-ber-tasks/src/sass/index.ts`. Currently there
are no tests for SCSS compilation anywhere in the monorepo. The goal is to
ensure that refactors to the sass task (e.g., changing how user overrides are
injected, changing import resolution) cannot silently break theme customization.

## How theme customization works

The SCSS build pipeline in `b-ber-tasks/src/sass/index.ts` assembles a single
stylesheet by concatenating three parts in order:

1. **User variable overrides** — `_project/_stylesheets/<theme-name>/_settings.scss`
   (if present). Loaded first so variables take effect before theme rules.
2. **Theme entry point** — the selected theme package's `application.scss`
   (resolved via `state.theme.entry`). Contains all layout, typography, and
   responsive rules.
3. **User element overrides** — `_project/_stylesheets/<theme-name>/_overrides.scss`
   (if present). Loaded last to win specificity over theme rules.

The combined string is passed to `dartSass.render()` with:

- A `$build: "<target>";` declaration prepended (values: every build name in
  b-ber-shapes-sequences — `epub`, `mobi`, `pdf`, `web`, `sample`, `reader`,
  `xml`) — controls build-target conditional SCSS inside theme partials
- A custom importer that resolves any `~<package>[/<path>]`, scoped or not,
  with `require.resolve` from the theme's directory, enabling cross-package
  `@import`

The compiled CSS is autoprefixed and written to the build's
`OPS/stylesheets/application.css` (`<hash>.css`, compressed, when
`NODE_ENV=production`).

> **Corrected 2026-11-15 (see Findings).** This section originally gave the
> user directory as `_src/_stylesheets/`, listed four `$build` values, limited
> the importer to `~@canopycanopycanopy/<pkg>`, and gave the output as
> `dist/_css/`. All four were wrong against the code.

### Theme structure

```
b-ber-theme-serif/
  application.scss     ← entry point
  _settings.scss       ← variables with !default (all overridable)
  typography/          ← font declarations and resets
  layout/              ← index.scss + 12 partials; some conditional on $build

b-ber-theme-sans/
  application.scss     ← imports serif layout/typography, then overrides
  _settings.scss       ← its own full settings file (serif's is never imported)
  _overrides.scss      ← element-level CSS adjustments
```

### User project structure

When `bber theme set <name>` is run, `b-ber-lib/Theme.ts`:

- Creates `_project/_stylesheets/<theme-name>/` in the project
- Copies the theme's `_settings.scss` as a starting point (non-overwriting)
- Creates an empty `_overrides.scss` placeholder (non-overwriting)
- Copies theme fonts/images into `_fonts/` / `_images/`
- Updates `config.yml` with the selected theme name

Users customize by editing `_settings.scss` (variable changes) or
`_overrides.scss` (element-level CSS). Both are concatenated around the theme
entry point at build time.

## Subtasks

- [x] Write `packages/b-ber-tasks/__tests__/sass.test.js` covering:
  - Three-part concatenation order (settings → theme → overrides)
  - `$build` variable is injected at the top of the compiled string
  - Missing user settings/overrides files are silently skipped (not an error)
  - Tilde import resolver maps `~@canopycanopycanopy/<pkg>` to node_modules
  - Autoprefixer is applied to the output
- [x] Document the theme mechanism in `b-ber-tasks/AGENTS.md` (sass section)
- [x] Add a summary of the customization workflow to `b-ber-theme-serif/AGENTS.md`
      and `b-ber-theme-sans/AGENTS.md`

## Notes

### Are these e2e tests?

No. These are **integration tests** of `sass/index.ts`. As written they
compile real SCSS with the real dart-sass and autoprefixer rather than mocking
`render`: dart-sass compiles the fixtures in milliseconds and both built-in
themes in well under a second, so the planned mock bought nothing. Only
`State` and the logger are mocked.

Tests belong in `packages/b-ber-tasks/__tests__/sass.test.js` following the
existing test pattern in that package.

### Reader SCSS and CSS Modules

The reader (`b-ber-reader-react`) has its own SCSS under `src/styles/`:

```
index.scss
styles/
  _variables.scss   ← reader UI colours and spacing
  _mixins.scss      ← layout helpers
  _fonts.scss       ← CrimsonPro font imports
  _controls.scss    ← navigation buttons, header/footer/sidebar
  _layout.scss      ← column layout, transforms
  _print.scss       ← print styles
  _media.scss       ← responsive breakpoints
  _footnote.scss    ← footnote display
```

(`_icons.scss` and `_spinner.scss`, listed here originally, no longer exist.
Rechecked 2026-11-15: none of these files references a theme package or a
theme variable.)

These are **reader UI chrome only** — they define the navigation shell, not
publication content styles. They do not reference theme variables from
`b-ber-theme-serif` or `b-ber-theme-sans`. Theme styles are compiled entirely
by `b-ber-tasks/sass` and injected into the reader as a separate pre-compiled
stylesheet at runtime.

**Conclusion:** it is safe to migrate reader SCSS to CSS Modules without
affecting theme customization. The two concerns are fully independent. That
migration is a separate task (track under b-ber-reader-react).

## Findings

Recorded 2026-11-15.

### Coverage

`npx jest packages/b-ber-tasks --coverage --collectCoverageFrom='packages/b-ber-tasks/src/sass/**/*.ts'`:

| | Stmts | Branch | Funcs | Lines |
| --- | --- | --- | --- | --- |
| Before | 0% | 0% | 0% | 0% |
| After | 100% | 100% | 100% | 100% |

44 tests in `packages/b-ber-tasks/__tests__/sass.test.js`, about one second.

### Test environment

The root Jest run uses jsdom for every package. From inside jsdom's realm
dart-sass does not recognise Node's `fs` module and every `@import` fails
with "Null check operator used on a null value", so the test file declares
`@jest-environment node`. That in turn needed a guard in
`packages/b-ber-reader-react/jest.setup.js`, which the root config runs for
every file and which assumed `window`.

### PRD corrections

The "How theme customization works" section was wrong in four places:
user stylesheets live in `<config.src>/_stylesheets/` (`_project/` by
default), not `_src/`; `$build` takes all seven build names, not four; the
importer handles any `~package`, not only `~@canopycanopycanopy/`; and output
goes to `OPS/stylesheets/`, not `dist/_css/`. b-ber-theme-sans' `_settings.scss`
is a complete settings file, not a set of overrides of serif's. The Notes'
reader file list was stale. Corrected in place above.

### Defects found (not fixed)

1. **Compile errors bypass the logger and hang the task.**
   `packages/b-ber-tasks/src/sass/index.ts:183` does `if (err) throw err`
   inside dart-sass's asynchronous callback. The throw escapes the Promise, so
   `.catch(log.error)` at line 206 never sees it, the task never settles, and
   with no `uncaughtException` handler anywhere in b-ber the CLI dies with
   Node's raw stack trace. An unresolvable `~` import fails the same way.
2. **The importer cuts the package path at the first occurrence of the
   package name.** `src/sass/index.ts:150` uses
   `modulePath.indexOf(moduleName)`. A directory above `node_modules` whose
   name contains the package name (a project in `fixture-mixins-project/`
   importing `~fixture-mixins/space`) resolves outside the package.
3. **A theme `fonts` or `images` that is a file stops the build.**
   `src/sass/index.ts:84` calls `lstatSync(themePath).isDirectory()` and
   discards the result, so the non-directory is not skipped and `readdirSync`
   at line 93 fails with ENOTDIR.
4. **`build:sass` and `watch:sass` in b-ber-theme-serif cannot work.**
   `packages/b-ber-theme-serif/package.json:20-21` run the plain `sass` CLI,
   which has no importer for the `~modularscale-sass/…` and
   `~@canopycanopycanopy/b-ber-theme-mixins/…` imports in `application.scss`:
   "Can't find stylesheet to import".

Also observed, and asserted or documented rather than counted as defects:

- `autoprefixer_options` is read once at module load
  (`src/sass/index.ts:13`). It is not CLI-configurable, so nothing changes it
  after load today.
- A project partial in `_stylesheets/` shadows a theme partial of the same
  name, because `_stylesheets/` is the first include path and the theme entry
  is compiled as a string.
- Both themes assign `$font-family-base` without `!default` inside
  `@if $build == 'reader'`, and `$reader-header-height` /
  `$reader-footer-height` without `!default` at all, so a project's settings
  cannot change them. This contradicts the themes' own rule that every
  variable uses `!default`; it may be deliberate for the reader.
- `errLogToConsole` (`src/sass/index.ts:180`) is #746, already filed.
