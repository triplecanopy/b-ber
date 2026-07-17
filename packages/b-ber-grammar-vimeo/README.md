# b-ber-grammar-vimeo

Handles the `vimeo` and `vimeo-inline` custom Markdown directives for Vimeo video embeds. The `vimeo` form registers a figure entry in state (for List of Illustrations) and emits a small linked thumbnail; the `vimeo-inline` form emits a full inline `<iframe>` pointing to `https://player.vimeo.com/video/<source>` with Vimeo player parameters as a URL query string — but only for `reader` and `web` builds. Other builds receive an unsupported-content block with a poster image fallback. Supported Vimeo player parameters (autopause, autoplay, background, color, controls, dnt, loop, muted, quality, etc.) are validated and transformed via the `vimeoAttributesTransformer` in `src/helpers.js`. Aspect ratio defaults to `16x9` with an override via the `aspectratio` attribute.

## Usage

Registered as a MarkdownIt plugin by the rendering engine:

```js
import vimeo from '@canopycanopycanopy/b-ber-grammar-vimeo'
// { plugin, name: 'vimeo', renderer }
```

## Dev

```
npm test
```

Tests are in `__tests__/index.test.js`.
