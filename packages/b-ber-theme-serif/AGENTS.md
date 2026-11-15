# AGENTS.md — b-ber-theme-serif

## What This Is

A serif-first SCSS theme for b-ber publications. The build pipeline compiles `application.scss` into a stylesheet embedded in EPUB, web, reader, and mobi output. The theme uses `b-ber-theme-mixins` for shared mixins and `modularscale-sass` for typographic scale. All settings variables use `!default` so project-level stylesheets can override them. The `$build` variable gates conditional rules per output format.

## Key Files

| File/Directory                | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `application.scss`            | Entry point; imports settings, mixins, typography, layout      |
| `_settings.scss`              | SCSS variables for colors, fonts, spacing, and layout defaults |
| `typography/_fonts.scss`      | Font-face declarations                                         |
| `typography/_reset.scss`      | Base element reset                                             |
| `layout/_container.scss`      | Page/column container rules                                    |
| `layout/_figure.scss`         | Figure and image layout                                        |
| `layout/_text.scss`           | Paragraph, heading, inline text styles                         |
| `layout/_list.scss`           | List element styles                                            |
| `layout/_table.scss`          | Table styles                                                   |
| `layout/_media-controls.scss` | Audio/video player controls                                    |
| `layout/_epub.scss`           | EPUB-specific conditional styles                               |
| `layout/_web.scss`            | Web-specific conditional styles                                |
| `layout/_reader.scss`         | Reader-specific conditional styles                             |
| `layout/_print.scss`          | Print/PDF styles                                               |
| `layout/_helpers.scss`        | Utility classes                                                |
| `fonts/`                      | Theme font files (empty placeholder in repo)                   |
| `images/`                     | Theme image assets (empty placeholder in repo)                 |
| `index.js`                    | Node entry point for build tooling                             |

## Dev Commands

No test suite, and no `test` script. The theme is exercised by b-ber-tasks'
`__tests__/sass.test.js`, which compiles it for the epub and reader builds.

```bash
npm run build:sass   # compile application.scss to application.css
npm run watch:sass   # watch and recompile on change
```

Both scripts currently fail with "Can't find stylesheet to import": the plain
`sass` CLI has no importer for the `~package/…` imports in `application.scss`.
Only b-ber's sass task resolves those.

## How projects customize this theme

The full mechanism is in b-ber-tasks' AGENTS.md ("The sass task and theme
customization"). In short, for a project whose `config.yml` says
`theme: b-ber-theme-serif`, the sass task compiles, in this order:

1. `$build: "<build>";`, one of `epub`, `mobi`, `pdf`, `web`, `sample`,
   `reader`, `xml`;
2. `_project/_stylesheets/b-ber-theme-serif/_settings.scss`, if present;
3. this package's `application.scss`;
4. `_project/_stylesheets/b-ber-theme-serif/_overrides.scss`, if present.

`bber theme set b-ber-theme-serif` creates that directory with a copy of this
package's `_settings.scss` and an empty `_overrides.scss`.

What this means when changing the theme:

- **A variable is customizable only if it is declared with `!default`.** The
  user's settings are compiled first, so `!default` leaves their value in
  place. A plain assignment here replaces it. `$reader-header-height` and
  `$reader-footer-height` are plain assignments today, and
  `@if $build == 'reader' { $font-family-base: $font-serif; }` resets the
  user's base font in the reader build.
- **`$build` is always set by b-ber.** The `$build: 'epub' !default` lines in
  `application.scss` only apply when the theme is compiled on its own.
- **`~package/path` imports resolve from this package's directory**, so the
  packages they name must be in this package's `dependencies`.
- **Relative imports are looked up in the project's `_stylesheets/` before
  this directory.** A project file `_stylesheets/_settings.scss` would replace
  `@import 'settings'`, and likewise for `typography` and `layout`.
- **`fonts/` and `images/` are copied into the project** (`_fonts/`,
  `_images/`) on every build without overwriting, so a project can replace a
  theme asset by putting a file of the same name there.

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- SCSS follows BEM-adjacent naming conventions established in `b-ber-theme-mixins`
- All variable declarations must use `!default` to remain overridable
- Build-target conditional logic must use the `$build` variable (`epub`, `reader`, `mobi`, `web`)
- Do not add compiled CSS files (`application.css`) to version control
