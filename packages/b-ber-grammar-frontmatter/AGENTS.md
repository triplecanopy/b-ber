# AGENTS.md — b-ber-grammar-frontmatter

## What This Is

A MarkdownIt front matter plugin callback that extracts YAML metadata from the top of each Markdown source file. Parses the raw YAML string using `YamlAdaptor`, constructs a `GuideItem`, adds it to `state.guide`, and merges the parsed metadata into the corresponding `state.spine.frontMatter` entry. This metadata is consumed downstream by `b-ber-templates` when building EPUB OPF and guide XML.

## Key Files

| File                      | Purpose                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/index.ts`            | Single exported factory `markdownItFrontmatterPlugin(self)` returning the front matter callback |
| `__tests__/index.test.js` | Jest tests                                                                                      |

## Dev Commands

```
npm test
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- This is a MarkdownIt front matter callback, not a container directive — receives the raw YAML string, not a token stream
- All side effects go to `state.guide` and `state.spine.frontMatter`; no HTML is produced

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the root AGENTS.md. No tasks are currently open. To add a task, create tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
