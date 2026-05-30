# b-ber-grammar-audio-video

Handles the `audio`, `audio-inline`, `video`, and `video-inline` custom Markdown directives. It validates the source attribute, resolves local media files from the project's `_media` directory (using `b-ber-parser-figure` for figure-page rendering), or handles remote sources including third-party hosts (Vimeo, YouTube — falling back to an iframe). For EPUB/Mobi builds the directive emits a small linked thumbnail that points to a generated figure page; for `reader` and `web` builds it emits an inline `<audio>` or `<video>` element with `<source>` children, playsinline attributes, and an optional poster image. Aspect ratio class names are applied to video elements.

## Usage

Registered as a MarkdownIt plugin by `b-ber-grammar-renderer` (via `b-ber-markdown-renderer`). The exported object contains `plugin` (the parser-figure plugin), `name`, and a `renderer` factory consumed by the rendering engine:

```js
import audioVideo from '@canopycanopycanopy/b-ber-grammar-audio-video'
// { plugin, name: 'audio-video', renderer }
```

## Dev

```
npm test
```

Tests are in `__tests__/index.test.js`.
