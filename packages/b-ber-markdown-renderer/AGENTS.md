# AGENTS.md — b-ber-markdown-renderer

## What This Is

`b-ber-markdown-renderer` converts Markdown source files into XHTML for b-ber builds. It configures a `markdown-it` instance and registers all b-ber grammar plugins (section, pullquote, logo, image, audio/video, Vimeo, iframe, dialogue, gallery, spread, footnotes, frontmatter) as `markdown-it` plugins. It also runs a pre-processing step for media directives before passing content to `markdown-it`. The package exports a single `markdownRenderer` singleton; the `b-ber-tasks` render task calls `markdownRenderer.render(fileName, data)` to produce XHTML for each chapter.

## Key Files

| File               | Purpose                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`     | Defines and exports the `markdownRenderer` singleton; configures `markdown-it` and registers all grammar plugins |
| `src/directives/`  | TASK-161's directive grammar (TASK-174): the block rule (`rule.ts`), the structure pass that pairs blocks and reports diagnostics (`structure.ts`), the line grammar (`syntax.ts`), diagnostics and the reporter (`diagnostics.ts`), the tree (`tree.ts`). Built as a second entry, `dist/directives`, which imports no `State` |
| `src/legacy-host.ts` | The two errors the build throws on a directive (`Duplicate [id]`, `Missing [id]`), word for word; block ids are checked per file |
| `scripts/parse-corpus.js` | Runs the parse over a directory of b-ber projects (TASK-161's test 9). By hand only: the projects are private |

## The directive rule

Every directive is parsed by `src/directives` (TASK-174, TASK-175); the `b-ber-parser-*` plugins are no longer registered. Each grammar still draws its own markup: the renderer passes in each block family's opener `render`, b-ber-grammar-section's and b-ber-grammar-pullquote's `close`, and each single-line directive's `validate` and `render`.

- **The rule claims the lines the old plugins claimed**, in their old order (`registry.ts`'s families, then `InlineClaim`s). A single-line directive becomes one `directive_inline` token, with its caption.
- **Blocks keep the old parsers' token shape** (each claimed line opens a container that runs to the end of its Markdown container: the file, a blockquote, a list item, a footnote), because the parse decides tight lists and markdown-it's `maxNesting` from token levels. The structure pass pairs every block and inserts one `directive_close` where it closes: at its `exit`, at an outer block's `exit` that crossed it, or at the end of its Markdown container. **Every close is drawn there**; the exit line and the range end draw nothing. An exit that closes nothing is ignored.
- **Passes that need a block's span during the parse** (speaker lines, gallery items) use `blockSpan`, which ends a block at its own `exit`.
- **Diagnostics go to `env.diagnostics`**; `render(fileName, data, env)` takes the env. `legacy-host.ts` throws the two errors the build has always thrown (`Duplicate [id]`, `Missing [id]`), word for word. Block ids are checked per file; `state.cursor` is gone (TASK-175).
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
