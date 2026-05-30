# b-ber-grammar-section

The universal block-container directive handler. Matches all container-type directives defined in `BLOCK_DIRECTIVES` (chapter, part, appendix, preface, and many others from the EPUB 3 Structural Semantic Vocabulary), as well as `exit`. Opening tokens emit a `<section id="..." class="..." epub:type="...">` with HTML comments marking the start; exit tokens close the element and remove the id from state. For `gallery` and `spread` directives in `reader`/`web` builds, the exit handler emits the additional closing tags required by those directives' multi-element scaffolds. Uses `b-ber-parser-section` as the MarkdownIt plugin and delegates open/close validation to `b-ber-grammar-renderer`.

## Usage

Registered as a MarkdownIt plugin by the rendering engine:

```js
import section from '@canopycanopycanopy/b-ber-grammar-section'
// { plugin, name: 'section', renderer }
```

## Dev

```
npm test
```

Tests are in `__tests__/index.test.js`.
