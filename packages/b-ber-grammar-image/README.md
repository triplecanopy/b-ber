# b-ber-grammar-image

Handles the `figure` and `figure-inline` custom Markdown directives for single image embeds. The `figure` form reads the image file from disk (using `image-size` to get dimensions), registers a figure entry in global state (for List of Illustrations generation), and emits a small linked thumbnail `<div>` with a `<figure>` pointing to the generated figure page. The `figure-inline` form emits a full inline figure using the `b-ber-templates` figure template, which renders the image at its natural or classified orientation (portrait/landscape) with an optional caption. Both forms require `id` and `source` attributes. Uses `b-ber-parser-figure` as the MarkdownIt plugin.

## Usage

Registered as a MarkdownIt plugin by the rendering engine:

```js
import image from '@canopycanopycanopy/b-ber-grammar-image'
// { plugin, name: 'figure', renderer }
```

## Dev

```
npm test
```

Tests are in `__tests__/index.test.js`.
