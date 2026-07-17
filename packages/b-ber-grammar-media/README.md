# b-ber-grammar-media

Handles the `media` and `media-inline` pseudo-directives, which are build-target-aware aliases resolved before the MarkdownIt parse step. Rather than emitting HTML directly, this package performs a text substitution pass over the raw Markdown string: it finds each `media` or `media-inline` directive, looks up the corresponding entry in `state.media` (populated from the project's `media.yml` file), and replaces the directive with the correct concrete directive (e.g. `vimeo`, `audio`, `figure`) for the current build target. The substituted Markdown is then parsed normally by the rest of the grammar pipeline. This allows authors to write a single `media` directive and have it resolve to different embed types per build.

## Usage

Called by the Markdown rendering pipeline before MarkdownIt processing:

```js
import media from '@canopycanopycanopy/b-ber-grammar-media'
media.render(markdownString) // returns updated Markdown string
```

## Dev

```
npm test
```

Tests are in `__tests__/index.test.js`.
