# b-ber-grammar-gallery

Handles the `gallery` / `exit` block directive pair. A `gallery` opening marker wraps its content in a build-target-aware container: for `reader` and `web` builds it emits a fullscreen gallery scaffold (`<section>` > `<div class="figure__gallery">` > `<figure>` > `<div class="figure__items">`); for EPUB, Mobi, PDF, and sample builds it emits a plain `<section>` that may be initialized as a slider by JavaScript if available. The exit marker (handled by `b-ber-grammar-section`) closes the open elements. Uses `b-ber-parser-gallery` as the MarkdownIt plugin and delegates open/close validation to `b-ber-grammar-renderer`.

## Usage

Registered as a MarkdownIt plugin by the rendering engine:

```js
import gallery from '@canopycanopycanopy/b-ber-grammar-gallery'
// { plugin, name: 'gallery', renderer }
```

## Dev

```
npm test
```

Tests are in `__tests__/index.test.js`.
