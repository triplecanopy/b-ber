# b-ber-shapes-dublin-core

A data-only package that exports two arrays of Dublin Core metadata identifiers. `elements` contains the 14 original DCMI elements (contributor, creator, description, format, identifier, language, publisher, relation, rights, source, subject, title, type, coverage). `terms` contains the full set of DCMI Metadata Terms (~55 entries including abstract, available, created, license, modified, and all refinements). These arrays are consumed by the b-ber build pipeline when generating EPUB OPF metadata and validating publication metadata supplied in a project's configuration.

## Usage

```js
import { elements, terms } from '@canopycanopycanopy/b-ber-shapes-dublin-core'
```

This package is a pure data export with no runtime logic.

## Dev

```
npm test
```

Tests verify that both exports are arrays.
