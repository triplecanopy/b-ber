# AGENTS.md — b-ber-grammar-frontmatter

## What This Is

A MarkdownIt front matter plugin callback that extracts YAML metadata from the top of each Markdown source file. Parses the raw YAML string using `YamlAdaptor`, constructs a `GuideItem`, and collects both into the render's `env.result` (`guide`, `frontMatter`). The build adds the guide item to `state.guide` and merges the metadata into the document's `state.spine.frontMatter` entry. This metadata is consumed downstream by `b-ber-templates` when building EPUB OPF and guide XML.

## Key Files

| File                      | Purpose                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/index.ts`            | Single exported factory `markdownItFrontmatterPlugin()` returning the front matter callback `(meta, env)` |
| `__tests__/index.test.js` | Jest tests                                                                                      |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- This is a MarkdownIt front matter callback, not a container directive — receives the raw YAML string, not a token stream
- Everything goes to `env.result`; no HTML is produced
