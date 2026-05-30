# b-ber-grammar-frontmatter

Handles YAML front matter blocks in Markdown source files. This package is a MarkdownIt front matter plugin callback (not a container directive). When MarkdownIt encounters a YAML front matter block at the top of a file, the plugin parses the YAML using `YamlAdaptor`, creates a `GuideItem` from the parsed metadata, adds it to `state.guide`, and merges the metadata into the matching spine entry in `state.spine.frontMatter`. The data stored here is later used by `b-ber-templates` when generating EPUB manifest and guide entries.

## Usage

Registered as a MarkdownIt front matter callback by the rendering engine:

```js
import frontmatter from '@canopycanopycanopy/b-ber-grammar-frontmatter'
// default export is a factory: (self) => plugin(meta)
```

## Dev

```
npm test
```

Tests are in `__tests__/index.test.js`.
