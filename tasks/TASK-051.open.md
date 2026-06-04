# TASK-051: Theme customization documentation and SCSS compilation test coverage

**Status:** not started
**Scope:** monorepo
**Priority:** medium
**GitHub Issue:** #518 — https://github.com/triplecanopy/b-ber/issues/518

## Description

Document the b-ber theme customization mechanism and add tests that verify the
SCSS compilation pipeline in `b-ber-tasks/src/sass/index.ts`. Currently there
are no tests for SCSS compilation anywhere in the monorepo. The goal is to
ensure that refactors to the sass task (e.g., changing how user overrides are
injected, changing import resolution) cannot silently break theme customization.

## How theme customization works

The SCSS build pipeline in `b-ber-tasks/src/sass/index.ts` assembles a single
stylesheet by concatenating three parts in order:

1. **User variable overrides** — `_src/_stylesheets/<theme-name>/_settings.scss`
   (if present). Loaded first so variables take effect before theme rules.
2. **Theme entry point** — the selected theme package's `application.scss`
   (resolved via `state.theme.entry`). Contains all layout, typography, and
   responsive rules.
3. **User element overrides** — `_src/_stylesheets/<theme-name>/_overrides.scss`
   (if present). Loaded last to win specificity over theme rules.

The combined string is passed to `dartSass.render()` with:

- A `$build: "<target>";` declaration prepended (values: `reader`, `epub`,
  `mobi`, `web`) — controls build-target conditional SCSS inside theme partials
- A custom importer that resolves `~@canopycanopycanopy/<pkg>` to the
  corresponding `node_modules` path, enabling cross-package `@use`/`@import`

The compiled CSS is autoprefixed and written to `dist/_css/`.

### Theme structure

```
b-ber-theme-serif/
  application.scss     ← entry point
  _settings.scss       ← variables with !default (all overridable)
  typography/          ← font declarations and resets
  layout/              ← 13 partials; conditional on $build

b-ber-theme-sans/
  application.scss     ← imports serif layout/typography, then overrides
  _settings.scss       ← overrides serif variable defaults
  _overrides.scss      ← element-level CSS adjustments
```

### User project structure

When `bber theme set <name>` is run, `b-ber-lib/Theme.ts`:

- Creates `_src/_stylesheets/<theme-name>/` in the project
- Copies the theme's `_settings.scss` as a starting point (non-overwriting)
- Creates an empty `_overrides.scss` placeholder (non-overwriting)
- Copies theme fonts/images into `_fonts/` / `_images/`
- Updates `config.yml` with the selected theme name

Users customize by editing `_settings.scss` (variable changes) or
`_overrides.scss` (element-level CSS). Both are concatenated around the theme
entry point at build time.

## Subtasks

- [ ] Write `packages/b-ber-tasks/__tests__/sass.test.js` covering:
  - Three-part concatenation order (settings → theme → overrides)
  - `$build` variable is injected at the top of the compiled string
  - Missing user settings/overrides files are silently skipped (not an error)
  - Tilde import resolver maps `~@canopycanopycanopy/<pkg>` to node_modules
  - Autoprefixer is applied to the output
- [ ] Document the theme mechanism in `b-ber-tasks/AGENTS.md` (sass section)
- [ ] Add a summary of the customization workflow to `b-ber-theme-serif/AGENTS.md`
      and `b-ber-theme-sans/AGENTS.md`

## Notes

### Are these e2e tests?

No. These are **integration tests** of `sass/index.ts`: they exercise the real
concatenation and import-resolution logic but mock `dartSass.render` (or use
a minimal inline SCSS fixture) to avoid compiling a full stylesheet in CI. A
full theme compilation smoke test (render → autoprefixer → write to disk) would
be a true e2e test and is out of scope here.

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
  _icons.scss       ← SVG icon styles
  _controls.scss    ← navigation buttons, header/footer/sidebar
  _spinner.scss     ← loading animation
  _layout.scss      ← column layout, transforms
  _print.scss       ← print styles
  _media.scss       ← responsive breakpoints
  _footnote.scss    ← footnote display
```

These are **reader UI chrome only** — they define the navigation shell, not
publication content styles. They do not reference theme variables from
`b-ber-theme-serif` or `b-ber-theme-sans`. Theme styles are compiled entirely
by `b-ber-tasks/sass` and injected into the reader as a separate pre-compiled
stylesheet at runtime.

**Conclusion:** it is safe to migrate reader SCSS to CSS Modules without
affecting theme customization. The two concerns are fully independent. That
migration is a separate task (track under b-ber-reader-react).
