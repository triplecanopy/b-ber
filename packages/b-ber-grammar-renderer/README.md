# b-ber-grammar-renderer

The shared MarkdownIt container renderer factory used by block-level grammar packages. Exports a single `createRenderer` function that takes a `render` function, `markerOpen` and `markerClose` regexes, and a `context` object, and returns a MarkdownIt container plugin configuration object with `marker`, `minMarkers`, `markerOpen`, `markerClose`, and a `validateOpen` method. The `validateOpen` method enforces that every opening directive has a unique `id`, tracks open directive ids in global state (`state.cursor`), and validates that exit directives match a previously opened directive. Packages that need custom close-time behaviour (e.g. `b-ber-grammar-pullquote`) do not use this factory and implement their own renderer.

## Usage

Imported by `b-ber-grammar-dialogue`, `b-ber-grammar-gallery`, `b-ber-grammar-section`, and `b-ber-grammar-spread`:

```js
import createRenderer from '@canopycanopycanopy/b-ber-grammar-renderer'
// Returns a MarkdownIt container plugin config object
```

## Dev

```
npm test
```

Tests are in `__tests__/index.test.js`.
