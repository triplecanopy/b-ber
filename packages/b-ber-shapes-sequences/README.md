# b-ber-shapes-sequences

A data package that defines the ordered task sequences for each b-ber build target. It exports a `build` array containing the shared base sequence of task names (clean, container, cover, sass, copy, scripts, render, loi, footnotes, inject, opf) and a `sequences` object that maps each output format (epub, mobi, pdf, web, sample, reader, xml) to the base sequence extended with its format-specific tail tasks. It also exports `createBuildSequence`, a helper that filters a list of desired format names against the known sequences and returns the matched keys (defaulting to all formats if none match).

## Usage

```js
import {
  sequences,
  createBuildSequence,
} from '@canopycanopycanopy/b-ber-shapes-sequences'

const toRun = createBuildSequence(['epub', 'web'])
// => ['epub', 'web']
```

This package is consumed by the b-ber CLI to determine which task pipeline to execute for a given build command.

## Dev

```
npm test
```

Tests verify that the `build` array and all format-keyed sequences export correctly.
