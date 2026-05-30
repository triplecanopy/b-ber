# b-ber-grammar-iframe

Handles the `iframe` and `iframe-inline` custom Markdown directives. The `iframe` form adds the embed to the figures list (state) and emits a small linked thumbnail pointing to a generated figure page, for display in the List of Illustrations. The `iframe-inline` form emits a fully rendered `<iframe>` element inline in the content — but only for `reader` and `web` builds; other build targets receive an unsupported-content placeholder. Attributes such as `height`, `width`, `title`, `poster`, and standard iframe attributes are parsed and forwarded to the rendered element. Uses `b-ber-parser-figure` as the MarkdownIt plugin.

## Usage

Registered as a MarkdownIt plugin by the rendering engine:

```js
import iframe from '@canopycanopycanopy/b-ber-grammar-iframe'
// { plugin, name: 'iframe', renderer }
```

## Dev

```
npm test
```

Tests are in `__tests__/index.test.js`.
