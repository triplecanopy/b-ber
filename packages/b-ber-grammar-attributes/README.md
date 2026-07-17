# b-ber-grammar-attributes

Shared attribute parsing and serialization utilities used by every other grammar package. This package does not handle a single Markdown directive on its own; instead it provides the functions that all directive handlers call to parse b-ber's inline attribute syntax (`key:value key2:"value with spaces"`) into plain objects, validate and filter those attributes against the allowed set for each directive type (using `b-ber-shapes-directives`), extend them with EPUB-required defaults (epub:type class taxonomy derived from frontmatter/bodymatter/backmatter classification), and serialize them back into HTML attribute strings or URL query strings for iframe embeds.

## Usage

Imported by every grammar package:

```js
import {
  attributes,
  attributesObject,
  attributesString,
  attributesQueryString,
  htmlId,
  parseAttrs,
  toAlias,
} from '@canopycanopycanopy/b-ber-grammar-attributes'
```

This package is not consumed directly by `b-ber-tasks` or end-user Markdown — it is a shared utility layer across the grammar pipeline.

## Dev

```
npm test
```

Tests are in `__tests__/index.test.js` and cover `parseAttrs`, `attributesObject`, `attributesString`, `attributesQueryString`, `htmlId`, and `toAlias`.
