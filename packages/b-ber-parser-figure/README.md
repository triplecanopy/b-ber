# b-ber-parser-figure

A markdown-it block-container plugin that parses b-ber `figure` directives into HTML. It recognises colon-fenced blocks (`:::`) with the name `figure` and emits `container_figure_open` / `container_figure_close` tokens. The plugin handles optional inline captions delimited by `::` on the line immediately following the directive open, slicing the caption body out of the source and attaching it to the open token's `children` property so the `render` callback can produce a `<figure>` / `<figcaption>` structure.

## Usage

This plugin is registered on a markdown-it instance by the b-ber build pipeline. A higher-level directive handler supplies `validate` and `render` callbacks:

```js
import figurePlugin from '@canopycanopycanopy/b-ber-parser-figure'

md.use(figurePlugin, 'figure', { validate, render })
```

The plugin is consumed during the `render` build step. The render callback is responsible for producing the final `<figure>` HTML including image, video, or audio elements and any caption.

## Dev

```
npm test
```

The test suite currently contains only a `test.todo` placeholder — no assertions are implemented yet.
