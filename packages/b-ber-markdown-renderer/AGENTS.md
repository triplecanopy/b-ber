# AGENTS.md — b-ber-markdown-renderer

## What This Is

`b-ber-markdown-renderer` converts Markdown source files into XHTML for b-ber builds. It configures a `markdown-it` instance and registers all b-ber grammar plugins (section, pullquote, logo, image, audio/video, Vimeo, iframe, dialogue, gallery, spread, footnotes, frontmatter) as `markdown-it` plugins. The package exports a single `markdownRenderer` singleton; the `b-ber-tasks` render task calls `markdownRenderer.renderDocument(document, source)` for each chapter, which returns its XHTML and what it collected.

## Key Files

| File               | Purpose                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`     | Defines and exports the `markdownRenderer` singleton; configures `markdown-it` and registers all grammar plugins |
| `src/directives/`  | TASK-161's directive grammar (TASK-174): the block rule (`rule.ts`), the structure pass that pairs blocks and reports diagnostics (`structure.ts`), the line grammar (`syntax.ts`), diagnostics and the reporter (`diagnostics.ts`), the tree (`tree.ts`). Built as a second entry, `dist/directives`, which imports no `State` |
| `src/xhtml.ts` | TASK-161's element builder (`h`) and the XHTML serializer (TASK-176). Imports nothing; the node types are b-ber-lib's (`XhtmlNode`) |
| `src/directives/render.ts` | Renders a document from its tree: each directive is built as elements by its grammar, the Markdown by markdown-it's rules |
| `src/legacy-host.ts` | The two errors the build throws on a directive (`Duplicate [id]`, `Missing [id]`), word for word; block ids are checked per file |
| `scripts/parse-corpus.js` | Runs the parse over a directory of b-ber projects (TASK-161's test 9). By hand only: the projects are private |

## The directive rule

Every directive is parsed by `src/directives` (TASK-174, TASK-175); the `b-ber-parser-*` plugins are no longer registered. Each grammar builds its own markup, as elements (TASK-176): the renderer passes in each block family's `render` (b-ber-lib's `BlockRender`) and each single-line directive's `validate` and `render` (`InlineRender`).

- **The rule claims the lines the old plugins claimed**, in their old order (`registry.ts`'s families, then `InlineClaim`s). A single-line directive becomes one `directive_inline` token, with its caption.
- **Blocks keep the old parsers' token shape** (each claimed line opens a container that runs to the end of its Markdown container: the file, a blockquote, a list item, a footnote), because the parse decides tight lists and markdown-it's `maxNesting` from token levels. The structure pass pairs every block and inserts one `directive_close` where it closes: at its `exit`, at an outer block's `exit` that crossed it, or at the end of its Markdown container. So the final token list is balanced, and the tree (`tree.ts`) holds each block with everything up to its close as its children. The exit line and the range end render nothing. An exit that closes nothing is ignored.
- **Passes that need a block's span during the parse** (speaker lines, gallery items) use `blockSpan`, which ends a block at its own `exit`.
- **Diagnostics go to `env.diagnostics`**; `render(fileName, data, env)` takes the env, and `renderDocument` returns them. `legacy-host.ts` throws the two errors the build has always thrown (`Duplicate [id]`, `Missing [id]`), word for word. Block ids are checked per file; `state.cursor` is gone (TASK-175).
- **Silent mode records nothing.** That is the TASK-153 fix: a block straight after a paragraph line no longer reports its own id as a duplicate.
- Diagnostic positions are offsets into the author's source: nothing rewrites the Markdown before the parse.
- **`media` is a node resolved when it renders** (b-ber-grammar-media's `resolve`, passed in as `media`), so the parse is the same for every target. It becomes the directive media.yml names for the target, rendered by that directive's grammar. Its caption is media.yml's, or else the one written under the line. There is no `prepare()` pre-pass any more (TASK-175).

## The XHTML is built as a tree

Every render, a nested one included, renders from the tree (`directives/render.ts`, which replaces markdown-it's `renderer.render`). TASK-176.

- **A block is one element, built in one place.** Its family's `render` is called at the opener with `{ node, env, h }`, and returns what builds the block from its rendered children and how it closed (`closedBy`). Calling it at the opener keeps the grammars' warnings, errors and what they collect in source order. No render call writes a `<section>` that another closes.
- **A single-line directive** is built by its grammar's `render` from its node (`info`, `line`, `caption`). A `media` line is resolved first, as before.
- **Markdown is markdown-it's.** Each token is rendered by markdown-it's own rule, with the whole token list and its index, since rules look at their neighbours (`renderToken`'s line breaks, the footnote rules). A pair's open and close are rendered together, around its children. The tree holds every token once, in order, so the Markdown renders exactly as markdown-it renders it.
- **`xhtml.ts` writes each thing one way** (see its header): `name="value"` attributes escaped as `Html.escape` does, `<img …/>` for void elements, every other element opened and closed, `--` kept out of comments. Markup a directive does not build is a `raw` node: markdown-it's output (a caption), the figure templates' strings (b-ber-templates), and an entity such as the citation's `&#8212;`.
- **The grammars are handed `h`**, since they cannot depend on this package. Their tests import it from `../../b-ber-markdown-renderer/src/xhtml`.

## Per-document state is in `env`

Nothing in the grammars, the parsers or this package imports `State` (TASK-177). Each render's env carries b-ber-lib's `DocumentEnv`:

- **`env.document`** is what the build tells the grammars, read only: the file name and its spine title, the target (render code branches on `target.features`), the project's images and media files, media.yml, `group_footnotes`, how many figures and footnote pages the earlier documents gave, and the book's footnote numbering.
- **`env.result`** is what the document collects for the build, in source order: figures, footnotes, guide items, front matter and remote assets. `renderDocument` returns it with the XHTML and the diagnostics; the render task writes it where State holds it (b-ber-tasks' `render`).
- **A nested render** (a caption, a gallery item's caption, a resolved `media` line, the notes page) gets `nestedEnv(env)`: the same document and result, and none of markdown-it's own env keys, as a nested render always started without them.
- **No module-level state outlives a render.** The footnote numbering is book-wide on purpose, so the build makes one per render task (`createFootnoteNumbering`) and passes it in every document; TASK-166 moves it onto the build context. markdown-it-front-matter's callback gets no env, so its rule is wrapped to hand the callback the env of the parse it is in, for the length of the rule's call.
- `render(fileName, data)` without a document renders as the first document of an epub with no media (tests).

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
- Nothing rewrites the Markdown before it is parsed. A directive that depends on the target is resolved when it renders, as `media` is, so that a document parses the same for every target (TASK-160's parse once).
- The output snapshot in `__tests__/index.test.js` (`fixtures/document.md` through every plugin) is the gate for a markdown-it upgrade. It was checked byte-for-byte against markdown-it 8 and 15 (TASK-144). A diff in it means authors' books change, so treat it as a behaviour change to explain, not a snapshot to update. The parser plugins (`b-ber-parser-*`) use markdown-it's block-parser internals (`StateBlock` line arrays, `md.block.tokenize`), so check the changelog for those too.
