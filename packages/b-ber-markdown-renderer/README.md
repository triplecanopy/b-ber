# `@canopycanopycanopy/b-ber-markdown-renderer`

`b-ber-markdown-renderer` converts Markdown source files into XHTML for b-ber builds. It configures a `markdown-it` instance and registers all b-ber grammar plugins (section, pullquote, logo, image, audio/video, Vimeo, iframe, dialogue, gallery, spread, footnotes, frontmatter) as `markdown-it` plugins. It also runs a pre-processing step for media directives before handing content to `markdown-it`. The package exports a single `markdownRenderer` singleton; the `b-ber-tasks` render task calls `markdownRenderer.render(fileName, data)` to produce XHTML for each chapter.

## Key exports

| Export                                    | Purpose                                                   |
| ----------------------------------------- | --------------------------------------------------------- |
| `markdownRenderer` (default)              | Singleton `MarkdownRenderer` instance                     |
| `markdownRenderer.render(fileName, data)` | Runs pre-processing then renders Markdown to XHTML string |
| `markdownRenderer.prepare(data)`          | Pre-processes raw Markdown (media directive expansion)    |

## Dev

```bash
npm test      # jest
npm run build
```
