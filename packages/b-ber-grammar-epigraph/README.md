# b-ber-grammar-epigraph

Handles the `epigraph` inline directive. Supports two forms: an image-based epigraph (`image "file.jpg"` with optional `caption`) that emits a full-width `<section epub:type="epigraph">` containing a figure and image element; and a text-only epigraph (`caption "..." citation "..."`) that emits one or more `<div class="pullquote full-width">` blocks with optional `<cite>` elements inside the epigraph section. Captions and citations support pipe-delimited (`|`) multi-value lists for producing multiple pull-quote blocks from a single directive. Uses `b-ber-parser-figure` as the MarkdownIt plugin.

## Usage

Registered as a MarkdownIt plugin by the rendering engine. The exported object provides `plugin`, `name`, and a `renderer` factory:

```js
import epigraph from '@canopycanopycanopy/b-ber-grammar-epigraph'
// { plugin, name: 'epigraph', renderer }
```

## Dev

```
npm test
```

Tests are in `__tests__/index.test.js`.
