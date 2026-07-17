# b-ber-shapes-directives

A data-only package that exports constants and sets defining every b-ber directive and its allowed attributes. It exports the colon marker strings and minimum lengths used by all block and inline parsers, named `Set` collections grouping directives by position in the publication (frontmatter, bodymatter, backmatter, inline, miscellaneous, draft, and deprecated), merged convenience sets (`BLOCK_DIRECTIVES`, `ALL_DIRECTIVES`), per-directive allowed-attribute sets (`SUPPORTED_ATTRIBUTES`), and sets of HTML audio/video/iframe attributes and Vimeo embed parameters. The parser packages and the b-ber render pipeline import from this package to validate directive names and attributes at parse time.

## Usage

```js
import {
  BLOCK_DIRECTIVE_FENCE,
  BODYMATTER_DIRECTIVES,
  SUPPORTED_ATTRIBUTES,
} from '@canopycanopycanopy/b-ber-shapes-directives'
```

This package is a pure data export with no runtime logic — it is consumed at build time by directive validators in `b-ber-lib` and all parser packages.

## Dev

```
npm test
```

Tests verify marker constants, directive set types, and merged set correctness.
