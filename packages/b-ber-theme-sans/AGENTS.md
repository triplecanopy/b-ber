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

No test suite. The `test` script exits with an error by default.

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- Do not duplicate SCSS partials from `b-ber-theme-serif`; import and override instead
- All variable declarations must use `!default` to remain overridable by project stylesheets
- Build-target conditional logic must use the `$build` variable (`epub`, `reader`, `mobi`, `web`)
- `_overrides.scss` is the correct place for element-level differences from the serif base

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the
root AGENTS.md. No tasks are currently open. To add a task, create
tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
