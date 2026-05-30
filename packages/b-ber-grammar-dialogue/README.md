# b-ber-grammar-dialogue

Handles the `dialogue` / `exit` block directive pair. A `dialogue` opening marker produces a `<section>` element with the directive's id and any parsed class or epub:type attributes; the matching `exit` marker closes it with `</section>`. The implementation delegates open/close validation and state tracking to `b-ber-grammar-renderer` (`createRenderer`) and uses `b-ber-parser-dialogue` as the MarkdownIt plugin. Dialogue content — the spoken lines between the open and exit markers — is rendered as normal Markdown inside the section.

## Usage

Registered as a MarkdownIt plugin by the rendering engine. The exported object provides `plugin`, `name`, and a `renderer` factory:

```js
import dialogue from '@canopycanopycanopy/b-ber-grammar-dialogue'
// { plugin, name: 'dialogue', renderer }
```

## Dev

```
npm test
```

Tests are in `__tests__/index.test.js`.
