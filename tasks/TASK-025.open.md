# TASK-025: Convert b-ber-grammar-\* packages to TypeScript

**Status:** not started
**Scope:** monorepo
**Priority:** medium

## Description

Convert all 16 `b-ber-grammar-*` packages from JavaScript to TypeScript.
Each package is a markdown-it plugin that transforms a single b-ber directive
type into HTML. All 16 follow the same export shape:

```ts
export default {
  plugin, // markdown-it plugin function
  name, // string directive name
  renderer, // (args) => plugin-options object
}
```

Each package is 1–2 source files, making this the highest package count but
lowest per-package effort of any Stage 2 step.

**Packages (16):**

- `b-ber-grammar-attributes` — convert first (6 others import it)
- `b-ber-grammar-renderer` — convert second (most block grammars import it)
- `b-ber-grammar-audio-video` (2 files: index.js + helpers.js)
- `b-ber-grammar-dialogue`
- `b-ber-grammar-epigraph`
- `b-ber-grammar-footnotes`
- `b-ber-grammar-frontmatter`
- `b-ber-grammar-gallery`
- `b-ber-grammar-iframe` (2 files)
- `b-ber-grammar-image` (2 files)
- `b-ber-grammar-logo`
- `b-ber-grammar-media` (2 files)
- `b-ber-grammar-pullquote`
- `b-ber-grammar-section`
- `b-ber-grammar-spread`
- `b-ber-grammar-vimeo` (2 files)

## Subtasks

- [ ] Add `@types/markdown-it` as dev dep to each grammar package (or root)
- [ ] Convert `b-ber-grammar-attributes` first; verify tests pass
- [ ] Convert `b-ber-grammar-renderer`; verify tests pass
- [ ] Convert remaining 14 packages (can be done in any order)
- [ ] Add tsdown build + update `package.json` `main`/`types` fields for each
- [ ] Run `npm test` from root; verify no regressions in dependent packages
- [ ] Update TASK-024 subtask checklist

## Notes

Branch: `feat/ts-stage-2`

Per-package tsconfig pattern (same as Stage 1):

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "./dist", "rootDir": "./src" },
  "include": ["src/**/*.ts"]
}
```

The `b-ber-grammar-attributes` package exports `attributes`, `attributesString`,
`attributesObject`, `htmlId`, `toAlias` — these are used widely across other
grammar packages. Type these carefully; the return types propagate everywhere.

`b-ber-grammar-renderer` is the base factory function for all block-directive
grammars. Typing its return shape (the markdown-it container plugin options
object) is the key task; once done, derived grammars just extend it.

markdown-it v8 plugin functions are `(md: MarkdownIt, ...options) => void`.
Use `@types/markdown-it` for `MarkdownIt`, `Token`, `StateBlock`, etc.

Test propagation: after each grammar is converted, run the test suite of
any grammar that imports it before moving on.

Parent: [[TASK-024]]
