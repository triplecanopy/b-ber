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

- [ ] Parsers: add the shared `BlockState`/`InlineState` types to b-ber-lib
      and type the rule functions (43 → 0)
- [ ] `b-ber-cli`: type the yargs builders and `argv` (40 → 0)
- [ ] `b-ber-tasks`: type the task interiors (41 → 0)
- [ ] Re-measure, and record any justified exception

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
