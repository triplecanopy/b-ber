# b-ber-grammar-spread

Handles the `spread` / `exit` block directive pair for full-bleed spread containers. For `reader` and `web` builds the opening marker emits a two-level `<div>` scaffold (`<div ...><div id="..." class="spread__content">`) that allows CSS to position content edge-to-edge; for EPUB, Mobi, PDF, and sample builds it emits a plain `<section>`. The exit directive (handled by `b-ber-grammar-section`) closes the appropriate elements and, in reader builds, appends an empty `<div>` required as a spread marker. Uses `b-ber-parser-gallery` as the MarkdownIt plugin and delegates open/close validation to `b-ber-grammar-renderer`.

## Usage

Registered as a MarkdownIt plugin by the rendering engine:

```js
import spread from '@canopycanopycanopy/b-ber-grammar-spread'
// { plugin, name: 'spread', renderer }
```

## Dev

```
npm test
```

Tests are in `__tests__/index.test.js`.
