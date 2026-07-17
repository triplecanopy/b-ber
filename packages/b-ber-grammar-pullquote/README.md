# b-ber-grammar-pullquote

Handles the `pullquote`, `blockquote`, and their shared `exit` directive. A `pullquote` opening marker emits a `<section>` element; a `blockquote` opening marker emits a `<blockquote>` element. Both support a `citation` attribute: if present, the citation text is appended as a `<footer><cite>` block when the matching `exit` directive is encountered. The package tracks open directives in a local `pullquoteIndices` stack so that the correct element name and citation are available at close time. Uses `b-ber-parser-section` as the MarkdownIt plugin and the block directive marker/min-length from `b-ber-shapes-directives`.

## Usage

Registered as a MarkdownIt plugin by the rendering engine:

```js
import pullquote from '@canopycanopycanopy/b-ber-grammar-pullquote'
// { plugin, name: 'pullQuote', renderer }
```

## Dev

```
npm test
```

Tests are in `__tests__/index.test.js`.
