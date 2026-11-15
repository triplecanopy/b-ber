# AGENTS.md — b-ber-theme-sans

## What This Is

A sans-serif SCSS theme for b-ber publications that extends `b-ber-theme-serif`. Rather than duplicating layout partials, it imports the serif package's `typography` and `layout` directly, then overrides settings via its own `_settings.scss` (sans default font family, no text indent, vertical space enabled) and applies element-level CSS overrides in `_overrides.scss`. The `$build` variable gates build-target conditional rules.

## Key Files

| File/Directory     | Purpose                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `application.scss` | Entry point; imports settings, mixins, serif layout/typography, then overrides                                         |
| `_settings.scss`   | SCSS variable overrides (font family, indent, spacing) relative to serif defaults                                      |
| `_overrides.scss`  | Element-level CSS overrides: body font, heading sizes, paragraph spacing, figure classes, web/mobile responsive styles |
| `fonts/`           | Theme font files (empty placeholder in repo)                                                                           |
| `images/`          | Theme image assets (empty placeholder in repo)                                                                         |
| `index.js`         | Node entry point for build tooling                                                                                     |

## Dev Commands

No test suite, no `test` script, and no build script. The theme is exercised
by b-ber-tasks' `__tests__/sass.test.js`, which compiles it with a project
`_settings.scss`.

## How projects customize this theme

The full mechanism is in b-ber-tasks' AGENTS.md ("The sass task and theme
customization"). For a project whose `config.yml` says
`theme: b-ber-theme-sans`, the sass task compiles, in this order:

1. `$build: "<build>";`, one of `epub`, `mobi`, `pdf`, `web`, `sample`,
   `reader`, `xml`;
2. `_project/_stylesheets/b-ber-theme-sans/_settings.scss`, if present;
3. this package's `application.scss`, which imports, in turn, its own
   `_settings.scss`, b-ber-theme-mixins, b-ber-theme-serif's `typography` and
   `layout` (through `~@canopycanopycanopy/b-ber-theme-serif/…`), and its own
   `_overrides.scss`;
4. `_project/_stylesheets/b-ber-theme-sans/_overrides.scss`, if present.

There are two `_overrides.scss` files and they do different jobs. This
package's is part of the theme and is compiled inside step 3. The project's
is the user's, created empty by `bber theme set b-ber-theme-sans`, and is
compiled last, so it wins over both themes' rules.

What this means when changing the theme:

- **A variable is customizable only if it is declared with `!default`.** The
  user's settings are compiled first. `$reader-header-height`,
  `$reader-footer-height`, and `$font-family-base` in the reader build (reset
  to `$font-sans` inside `@if $build == 'reader'`) are plain assignments, so
  a project cannot change them from its settings.
- **`~package/path` imports resolve from this package's directory**, which is
  why b-ber-theme-serif is a dependency here, not a peer.
- **Relative imports are looked up in the project's `_stylesheets/` first.** A
  project file `_stylesheets/_overrides.scss` or `_stylesheets/_settings.scss`
  would replace this package's own file of that name.
- This package's `fonts/` and `images/` are empty, and `index.js` exports
  empty `fonts` and `images` lists, so it contributes no assets.

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- Do not duplicate SCSS partials from `b-ber-theme-serif`; import and override instead
- All variable declarations must use `!default` to remain overridable by project stylesheets
- Build-target conditional logic must use the `$build` variable (`epub`, `reader`, `mobi`, `web`)
- `_overrides.scss` is the correct place for element-level differences from the serif base
