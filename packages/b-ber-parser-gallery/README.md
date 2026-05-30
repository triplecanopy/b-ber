# b-ber-parser-gallery

A markdown-it block-container plugin that parses b-ber `gallery` directives into HTML. It recognises colon-fenced blocks (`:::`) with the name `gallery` and tokenises child items written as inline `:: … ::` attribute strings. Each child item is parsed with `b-ber-grammar-attributes` and converted into a `<div class="gallery__item">` containing either an `<img>`, `<video>`, or `<audio>` element plus an optional caption `<div class="figcaption">`. MIME types for media sources are resolved with `mime-types`.

## Usage

This plugin is registered on a markdown-it instance by the b-ber build pipeline. A higher-level directive handler supplies `validateOpen` and `render` callbacks:

```js
import galleryPlugin from '@canopycanopycanopy/b-ber-parser-gallery'

md.use(galleryPlugin, 'gallery', { validateOpen, render })
```

The plugin is consumed during the `render` build step alongside other block-container parsers.

## Dev

```
npm test
```

The test suite currently contains only a `test.todo` placeholder — no assertions are implemented yet.
