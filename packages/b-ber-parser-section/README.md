# b-ber-parser-section

A markdown-it block-container plugin that parses generic b-ber structural directives (frontmatter, bodymatter, backmatter, chapter, part, etc.) into HTML `<section>` elements. It recognises colon-fenced blocks (`:::`) and emits `container_<name>_open` / `container_<name>_close` tokens backed by `<section>` tags. Unlike the figure or gallery parsers it performs no child-token post-processing — the open and close tokens are passed directly to the `render` callback supplied by the calling directive handler, which adds the appropriate EPUB structural attributes.

## Usage

This plugin is registered on a markdown-it instance by the b-ber build pipeline for every block-level structural directive:

```js
import sectionPlugin from '@canopycanopycanopy/b-ber-parser-section'

md.use(sectionPlugin, 'chapter', { validateOpen, render })
```

The plugin is consumed during the `render` build step.

## Dev

```
npm test
```

The test suite currently contains only a `test.todo` placeholder — no assertions are implemented yet.
