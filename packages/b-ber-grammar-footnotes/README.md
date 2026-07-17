# b-ber-grammar-footnotes

Handles footnote collection and rendering as a MarkdownIt core rule (not a container directive). After MarkdownIt processes a source file, this package's plugin function receives the full token stream, prepends a `<section class="footnotes break-after">` wrapper with an `<h1>` heading (using the spine entry's title for the current file), appends the closing `</section>`, renders the augmented token stream to HTML, and stores the result in global state under `state.footnotes`. Footnote pages are generated later by `b-ber-parser-footnotes` from that collected state.

## Usage

Registered as a MarkdownIt core rule by the rendering engine:

```js
import footnotes from '@canopycanopycanopy/b-ber-grammar-footnotes'
// default export is a factory: (self) => plugin(tokens)
```

## Dev

```
npm test
```

Tests are in `__tests__/index.test.js`.
