# b-ber-parser-footnotes

A markdown-it plugin that parses both inline (`^[…]`) and reference-style (`[^label]` / `[^label]: …`) footnotes from Markdown source and renders them as EPUB-compatible HTML. It emits footnote reference links with `epub:type="noteref"` and footnote list items with `epub:type="footnote"`, and injects hidden back-links (↵) into the footnote body. After processing a document the plugin strips the footnote block from the main token stream and passes it to a callback so the build pipeline can write footnotes to a separate `notes.xhtml` file. A `Counter` helper tracks numbering across pages, supporting both per-document and globally-grouped footnote lists (controlled by `bberState.config.group_footnotes`).

## Usage

This plugin is consumed by the b-ber build pipeline's `render` and `footnotes` build steps:

```js
import footnotePlugin from '@canopycanopycanopy/b-ber-parser-footnotes'

md.use(footnotePlugin, footnoteTokens => {
  // footnoteTokens is the extracted footnote block for this document
})
```

The callback receives the collected footnote tokens; the pipeline writes them to `notes.xhtml`.

## Dev

```
npm test
```

The test suite currently contains only a `test.todo` placeholder — no assertions are implemented yet.
