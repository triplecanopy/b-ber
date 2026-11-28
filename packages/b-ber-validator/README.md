# `@canopycanopycanopy/b-ber-validator`

`b-ber-validator` checks the directives in a b-ber Markdown file with the same parse the build runs, and reports what it finds. It is what `bber check` runs, through the `validate` task in `b-ber-tasks`.

## Key exports

| Export                              | Purpose                                                                                     |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| `check(source, file)`               | The file's diagnostics, in source order. `file` is the name they carry, e.g. `_markdown/ch-01.md` |
| `report(source, diagnostic, opts?)` | One diagnostic as text: `file:line:col - severity code: message`, the source line with the span underlined, then each note. `{ color: true }` adds ANSI colour |
| `Diagnostic`, `Severity`, …         | The diagnostic types                                                                        |

```
_markdown/ch-01.md:3:5 - warning unknown-name: Unknown directive `chaptr`. Did you mean `chapter`?
  3 | ::: chaptr:ch-01
    |     ^^^^^^
  note: The line is rendered as text
```

## Dev

```bash
npm test      # tsc type-check + biome + jest
npm run build
```
