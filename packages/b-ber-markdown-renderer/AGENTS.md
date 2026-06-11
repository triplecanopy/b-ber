# AGENTS.md — b-ber-markdown-renderer

## What This Is

`b-ber-markdown-renderer` converts Markdown source files into XHTML for b-ber builds. It configures a `markdown-it` instance and registers all b-ber grammar plugins (section, pullquote, logo, image, audio/video, Vimeo, iframe, dialogue, gallery, spread, footnotes, frontmatter) as `markdown-it` plugins. It also runs a pre-processing step for media directives before passing content to `markdown-it`. The package exports a single `markdownRenderer` singleton; the `b-ber-tasks` render task calls `markdownRenderer.render(fileName, data)` to produce XHTML for each chapter.

## Key Files

| File               | Purpose                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`     | Defines and exports the `markdownRenderer` singleton; configures `markdown-it` and registers all grammar plugins |

## Dev Commands

```bash
npm test      # jest
npm run build # compile src/ → dist/ with tsdown (CJS)
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- The `MarkdownRenderer` class is a singleton (`export default markdownRenderer`). Do not instantiate it directly in other packages.
- Grammar plugins are registered in the constructor and cannot be reconfigured at runtime. To add a new directive type, add the grammar package as a dependency and register it in `src/index.ts`.
- `markdownIt` is configured with `xhtmlOut: true` to produce valid XHTML. Do not change this — EPUB requires XHTML.
- The `prepare()` step runs before `markdownIt.render()` and handles media directive pre-processing. If a new directive requires pre-processing, add it there.
