# `@canopycanopycanopy/b-ber-validator`

`b-ber-validator` validates the custom directive syntax in b-ber Markdown source files before a build runs. It is written in TypeScript and implements a parser-combinator library (`combinators/`) that parses the b-ber fence syntax (`::: directive-name id attr:value ...` / `exit`). The validator checks that directive names are known, that open blocks are correctly closed, and that attribute syntax is well-formed. On failure it reports the line number and a caret-pointed excerpt via the `report` helper. The `validate` task in `b-ber-tasks` calls this package.

## Key exports

| Export                  | Purpose                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `validator` (default)   | Top-level parser; run against the full file text                        |
| `report(name, failure)` | Prints a human-readable parse error with line number and source context |
| `colors`                | ANSI colour constants used by `report`                                  |

### Combinators (`src/combinators/`)

Parser-combinator primitives: `string`, `regex`, `sequence`, `oneOf`, `many`, `optional`, `required`, `map`, `not`, `lazy`, `close`, `constrained`, `eol`, `eos`.

## Dev

```bash
npm test      # tsc type-check + eslint + jest
npm run build
```
