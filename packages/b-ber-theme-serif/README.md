# b-ber-theme-serif

A serif-first SCSS theme for b-ber publications. During a build, b-ber compiles `application.scss` into the stylesheet that is embedded in generated EPUB, web, reader, and mobi output. The theme imports `b-ber-theme-mixins` for shared mixins and `modularscale-sass` for typographic scale calculations. Settings are controlled by SCSS variables in `_settings.scss`; all variables use `!default` so they can be overridden by project-level stylesheets. The `$build` variable gates conditional rules for `epub`, `reader`, `mobi`, and `web` targets.

## Contents

| Path               | Purpose                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `application.scss` | Entry point; imports settings, mixins, typography, and layout                                                           |
| `_settings.scss`   | SCSS variables for colors, fonts, spacing, and layout defaults                                                          |
| `typography/`      | `_fonts.scss` (font-face rules), `_reset.scss` (base reset)                                                             |
| `layout/`          | Partials for container, figure, text, list, table, media controls, epub/web/reader/print variants, and helper utilities |
| `fonts/`           | Directory for theme font files (empty placeholder in repo)                                                              |
| `images/`          | Directory for theme image assets (empty placeholder in repo)                                                            |
| `index.js`         | Node entry point (exposes package path for build tooling)                                                               |

## Dev

No test suite. The `test` script exits with an error by default.

To compile the stylesheet locally:

```bash
npm run build:sass   # outputs application.css
npm run watch:sass   # watch mode
```
