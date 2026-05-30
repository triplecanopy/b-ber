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

No test suite. The `test` script exits with an error by default.

```bash
npm run build:sass   # compile application.scss to application.css
npm run watch:sass   # watch and recompile on change
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- SCSS follows BEM-adjacent naming conventions established in `b-ber-theme-mixins`
- All variable declarations must use `!default` to remain overridable
- Build-target conditional logic must use the `$build` variable (`epub`, `reader`, `mobi`, `web`)
- Do not add compiled CSS files (`application.css`) to version control

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the
root AGENTS.md. No tasks are currently open. To add a task, create
tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
