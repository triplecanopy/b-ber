# TASK-148: Remove interior explicit any from tasks, cli and the parsers

**Epic:** Upgrade tooling
**GitHub Issue:** #739 — https://github.com/triplecanopy/b-ber/issues/739
**Scope:** monorepo

## Description

TASK-134 made the types refactor-ready at the boundaries. No published `.d.ts`
contains `any`, `State` is typed, and every internal module stub is gone. That
was the part that blocked a refactor.

What remains is `any` *inside* packages: 224 explicit `any`s by Biome's
`noExplicitAny` count on 2026-11-07, none of which leaks into another package.
When TASK-134 closed, the target for them was agreed as **0 outside
`b-ber-reader-react`**, with any exception justified in a comment at the site.
This task does that.

| Where | Count | What it is | Route to 0 |
| ----- | ----- | ---------- | ---------- |
| `b-ber-tasks` | 41 | Task interiors: metadata and spine entries, YAML, the mobi, web and xml helpers | Mostly mechanical now that `State` is typed. It is the package a refactor touches most. |
| `b-ber-cli` | 40 | yargs builders and `argv` in every command | Type against yargs 13, or use a small `Argv` interface per command. The CLI pins `yargs@^13`; the `@types/yargs` in `node_modules` is jest's, for yargs 17. |
| parsers (footnotes 27, gallery 12, others 4) | 43 | markdown-it `StateBlock`/`StateInline` in the rule functions | One structural `BlockState`/`InlineState` in b-ber-lib's `src/markdown.ts`. `MarkdownItHost`'s `BlockRule` would then take it instead of `unknown`. |

`b-ber-reader-react`'s 100 are out of scope. They are DOM and html-to-react node
walking, css-tree and legacy props, and belong to the Reader quality epic (#713)
under its migration conventions.

## Subtasks

- [x] Parsers: add the shared `BlockState`/`InlineState` types to b-ber-lib
      and type the rule functions (43 → 0)
- [x] `b-ber-cli`: type the yargs builders and `argv` (40 → 0)
- [x] `b-ber-tasks`: type the task interiors (41 → 0)
- [x] Re-measure, and record any justified exception

## Notes

- Measure with
  `npx biome lint --only=suspicious/noExplicitAny --max-diagnostics=none --reporter=github . 2>/dev/null | grep -c noExplicitAny`,
  and per package by adding its path. The published-declaration measure from
  TASK-134 must stay at 0.
- **Types only.** Where a correct type exposes a defect, cast narrowly and cite
  its issue, as TASK-134 did. Do not fix behaviour here.
- `b-ber-cli`'s handlers have full test coverage since TASK-050 (#517), so a type
  change that alters behaviour there will show up in the tests.
- Once a package reaches 0, Biome can hold it there with an `overrides` entry
  setting `noExplicitAny` to `error` for that path. That is a rule-level change,
  so it belongs to TASK-133.
- Related: TASK-134 (the boundary work and the agreed target), TASK-119 (green
  typecheck), TASK-133 (Biome recommended rules).

## Result (2026-11-13)

| Measure | Before | After |
| ------- | ------ | ----- |
| Explicit `any` outside reader-react | 124 | **0**, no exceptions |
| Explicit `any` in reader-react | 100 | 100 (out of scope, #713) |
| `any` in published declarations | 0 | 0 |
| `npm run typecheck` | 33/33 | 33/33 |

What it took, by package:

- **b-ber-cli.** The CLI was typechecked against the `@types/yargs` 17 that
  jest brings and npm hoists, not the yargs 13 it runs. It now has
  `@types/yargs` 13.0.12 as an exact dev dependency. Builders take `Argv`,
  handlers `Arguments<…>`. `<name>` and `<title>` are narrowed in the handler
  with a comment, since yargs enforces them through the command string and
  types them optional. Deploy's variadic `[builds...]` gained `array: true`,
  which yargs 13 already applies to a variadic positional. Generate's
  `PageMetadata` admits the optional page type it already skipped when empty.
- **b-ber-tasks.** Most were values `State` already types. Figures take the
  templates' `FigureData`, now exported from the `figures` entry, plus the
  `page` and `pageOrder` the directives add. `pureimage`'s context is a local
  interface rather than the ambient stub, which tsdown's declaration build
  cannot see (#745). Browsersync's middleware is passed as a one-item array,
  which its `listMerge` treats the same as a bare function.
- **Parsers.** `markdown.ts` gained `MarkdownToken`, `BlockState`,
  `InlineState`, `CoreState` and `BlockRule`/`InlineRule`/`CoreRule`. A rule's
  `state` stays `unknown` where it is registered: the structural states cannot
  be checked against markdown-it's own (that would mean depending on
  markdown-it, which the file exists to avoid), and the rule types are written
  in method form, whose parameters TypeScript checks bivariantly, so each
  parser's rule declares the state it reads. b-ber-grammar-footnotes' callback
  takes `Partial<MarkdownToken>[]`.

Defects the types exposed, cast at the site and filed: #757 (the LOI title
page's `SpineItem` has no `buildType`) and #758 (the gallery renders
`type="false"` for an unknown extension).
