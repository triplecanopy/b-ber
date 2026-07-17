# b-ber-grammar-logo

Handles the `logo` inline directive. Emits a `<figure class="logo">` containing an `<img>` element with a fixed inline width of 120px. Requires a `source` attribute pointing to an image file in the project's `_images` directory; warns (but does not abort) if the file does not exist. The source path is converted to a relative `../images/` URL in the output HTML. Uses `b-ber-parser-figure` as the MarkdownIt plugin.

## Usage

Registered as a MarkdownIt plugin by the rendering engine:

```js
import logo from '@canopycanopycanopy/b-ber-grammar-logo'
// { plugin, name: 'logo', renderer }
```

## Dev

```
npm test
```

Tests are in `__tests__/index.test.js`.
