# AGENTS.md — b-ber-validator

## What This Is

`b-ber-validator` is what `bber check` runs: a thin layer over the parse the build runs (TASK-178). `check(source, file)` parses a Markdown file with b-ber-markdown-renderer's `/parse` entry and returns its diagnostics; `report(source, diagnostic)` formats one as TASK-161 specifies. There is no grammar here. One grammar decides what is valid, so `bber check` and the build cannot disagree about a document (#797). The `validate` task in `b-ber-tasks` calls both.

```
source → check (b-ber-markdown-renderer/parse: the build's parse, pureHost) → Diagnostic[] → report → text
```

## Key Files

| File            | Purpose                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------- |
| `src/index.ts`  | Package entry point: `check`, `report`, and the diagnostic types, re-exported from the parse |
| `src/check.ts`  | `check(source, file)`: the parse's diagnostics, in source order                             |
| `src/report.ts` | `report(source, diagnostic, { color })`: `file:line:col - severity code: message`, the line with the span underlined, then each note |
| `src/colors.ts` | The SGR codes `report` colours with                                                         |

## Dev Commands

```bash
npm test      # tsc type-check + biome + jest
npm run build # tsc compile src/ → dist/ (runs tests first)
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All source files are `.ts`.
- The build step (`npm run build`) runs `npm test` first; a failing test prevents the build from completing.
- **Import the parse only from `@canopycanopycanopy/b-ber-markdown-renderer/parse`.** It is the one entry point this package depends on, so consolidating the directive packages (TASK-179) renames one import. Never import the renderer's main entry, the directive internals, or a grammar package here.
- **No grammar here.** A new diagnostic, or a change to what one says, belongs in the parse (b-ber-markdown-renderer's `src/directives/`), where the build sees it too.
- The tests run against the renderer's **built** `/parse` entry, as published; build it first.
- `report` returns text and writes nothing. The caller decides where it goes; `validate` writes it to stdout, because the logger trims each line of a message and would move the carets.
- `check` throws where the build's parse throws on something other than the directive structure (a `figure` with no `source`; front matter with a `type` and no `title`). Those are not diagnostics yet (TASK-161's `missing-attribute`).
