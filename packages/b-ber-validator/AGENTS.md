# AGENTS.md — b-ber-validator

## What This Is

`b-ber-validator` validates the custom directive syntax in b-ber Markdown source files before a build runs. It is written in TypeScript and implements a parser-combinator library (`src/combinators/`) that parses the b-ber fence syntax (`::: directive-name id attr:value ...` blocks closed by `:::exit:id`). The validator checks that directive names are known (from `b-ber-shapes-directives`), that open blocks are correctly closed, and that attribute syntax is well-formed. On failure, the `report` helper prints the line number and a caret-pointed source excerpt. The `validate` task in `b-ber-tasks` calls this package.

## Key Files

| File               | Purpose                                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/validator.ts` | Top-level grammar: assembles combinators into a complete directive parser                                                                                        |
| `src/index.ts`     | Package entry point; re-exports `validator`, `report`, `colors`                                                                                                  |
| `src/report.ts`    | Formats and prints a parse failure with line number and source context                                                                                           |
| `src/colors.ts`    | ANSI colour constants used by `report`                                                                                                                           |
| `src/combinators/` | Parser-combinator primitives: `string`, `regex`, `sequence`, `oneOf`, `many`, `optional`, `required`, `map`, `not`, `lazy`, `close`, `constrained`, `eol`, `eos` |
| `src/lib/flat.ts`  | Utility to flatten nested parser result arrays                                                                                                                   |
| `src/typings/`     | TypeScript type declarations                                                                                                                                     |

## Dev Commands

```bash
npm test      # tsc type-check + eslint + jest
npm run build # tsc compile src/ → dist/ (runs tests first)
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- This is the only TypeScript package in the build pipeline; all source files are `.ts`.
- The build step (`npm run build`) runs `npm test` first; a failing test prevents the build from completing.
- Combinators follow a consistent signature: they accept parser inputs and return a `Parser<T>`. Do not add stateful combinators.
- Directive names are sourced from `b-ber-shapes-directives` (`BLOCK_DIRECTIVES`, `INLINE_DIRECTIVES`, `MISC_DIRECTIVES`, `DRAFT_DIRECTIVES`, `DEPRECATED_DIRECTIVES`). Adding a new directive type requires updating that shapes package.

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the
root AGENTS.md. No tasks are currently open. To add a task, create
tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
