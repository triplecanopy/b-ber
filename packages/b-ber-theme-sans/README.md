# b-ber-theme-sans

A sans-serif SCSS theme for b-ber publications. It extends `b-ber-theme-serif` by importing that package's `typography` and `layout` partials directly, then overrides key settings via `_settings.scss` (e.g. `$font-family-base` defaults to `$font-sans` in reader builds, `$text-indent` is disabled, `$vertical-space` is enabled) and applies additional element-level overrides via `_overrides.scss`. During a build, b-ber compiles `application.scss` into the stylesheet embedded in generated output. The `$build` variable gates conditional rules for `epub`, `reader`, `mobi`, and `web` targets.

## Contents

| Path               | Purpose                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `application.scss` | Entry point; imports settings, mixins, serif layout/typography, then overrides                                      |
| `_settings.scss`   | SCSS variable overrides relative to the serif theme defaults                                                        |
| `_overrides.scss`  | Element-level CSS overrides (body font family, heading sizes, paragraph spacing, figure classes, web/mobile styles) |
| `fonts/`           | Directory for theme font files (empty placeholder in repo)                                                          |
| `images/`          | Directory for theme image assets (empty placeholder in repo)                                                        |
| `index.js`         | Node entry point (exposes package path for build tooling)                                                           |

## Dev

No test suite. The `test` script exits with an error by default.
