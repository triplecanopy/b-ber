# AGENTS.md — b-ber-markdown-renderer

## What This Is

`b-ber-markdown-renderer` converts Markdown source files into XHTML for b-ber builds. It configures a `markdown-it` instance and registers all b-ber grammar plugins (section, pullquote, logo, image, audio/video, Vimeo, iframe, dialogue, gallery, spread, footnotes, frontmatter) as `markdown-it` plugins. It also runs a pre-processing step for media directives before passing content to `markdown-it`. The package exports a single `markdownRenderer` singleton; the `b-ber-tasks` render task calls `markdownRenderer.render(fileName, data)` to produce XHTML for each chapter.

## Key Files

| File               | Purpose                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`     | Defines and exports the `markdownRenderer` singleton; configures `markdown-it` and registers all grammar plugins |
| `src/directives/`  | TASK-161's directive grammar (TASK-174): the block rule (`rule.ts`), the structure pass that pairs blocks and reports diagnostics (`structure.ts`), the line grammar (`syntax.ts`), diagnostics and the reporter (`diagnostics.ts`), the tree (`tree.ts`). Built as a second entry, `dist/directives`, which imports no `State` |
| `src/legacy-host.ts` | How the directive rule shares ids with the old plugins through `state.cursor`, and throws today's errors, until TASK-175 |
| `scripts/parse-corpus.js` | Runs the parse over a directory of b-ber projects (TASK-161's test 9). By hand only: the projects are private |

## The directive rule

The structural blocks (`chapter`, `subchapter`, the frontmatter, bodymatter and backmatter sets, `epigraph`) are parsed by `src/directives`, not by b-ber-parser-section, and rendered by b-ber-grammar-section's `render` as before. The other directives still use their own plugins until TASK-175.

- **Output is unchanged by construction.** The rule reproduces b-ber-parser-section's token shape (each claimed line opens a container that runs to the end of its range), because the parse decides tight lists and markdown-it's `maxNesting` from token levels. The structure pass then rewrites the tokens into real pairs, keeping render-only `directive_exit`/`directive_end` tokens where the old parser's tokens were.
- **Diagnostics go to `env.diagnostics`**; `render(fileName, data, env)` takes the env. Nothing new is thrown or printed: `legacy-host.ts` throws the two errors the old parser threw (`Duplicate [id]`, `Missing [id]`), word for word.
- **Silent mode records nothing.** That is the TASK-153 fix: a block straight after a paragraph line no longer reports its own id as a duplicate.
- Diagnostic positions are offsets into the source markdown-it parsed. `render()` parses the output of `prepare()`, so a `media` line whose replacement adds caption lines shifts the lines after it.

## Dev Commands

```bash
npm test      # jest
npm run build # compile src/ → dist/ with tsdown (CJS)
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- The `MarkdownRenderer` class is a singleton (`export default markdownRenderer`). Do not instantiate it directly in other packages.
- Grammar plugins are registered in the constructor and cannot be reconfigured at runtime. To add a new directive type, add the grammar package as a dependency and register it in `src/index.ts`.
- `markdownIt` is configured with `xhtmlOut: true` to produce valid XHTML. Do not change this — EPUB requires XHTML.
- The `prepare()` step runs before `markdownIt.render()` and handles media directive pre-processing. If a new directive requires pre-processing, add it there.
- The output snapshot in `__tests__/index.test.js` (`fixtures/document.md` through every plugin) is the gate for a markdown-it upgrade. It was checked byte-for-byte against markdown-it 8 and 15 (TASK-144). A diff in it means authors' books change, so treat it as a behaviour change to explain, not a snapshot to update. The parser plugins (`b-ber-parser-*`) use markdown-it's block-parser internals (`StateBlock` line arrays, `md.block.tokenize`), so check the changelog for those too.
