# AGENTS.md — b-ber-templates

## What This Is

Provides JavaScript template classes used by the b-ber build pipeline to generate EPUB structural files and figure markup. Each class exposes static methods returning either XML/HTML strings or Vinyl file objects with `{% body %}` placeholders that the pipeline fills in at build time. Templates cover EPUB 3 structural formats, project scaffolding, and per-build-target figure markup for images, audio, video, iframes, and Vimeo embeds.

## Key Files

| File/Directory        | Purpose                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`        | Barrel export for all template classes                                                                                                    |
| `src/Ncx/`            | EPUB 2 NCX navigation document (head, docTitle, navMap, navPoints)                                                                        |
| `src/Opf/Pkg.ts`      | OPF `<package>` wrapper element                                                                                                           |
| `src/Opf/Metadata.ts` | OPF `<metadata>` block                                                                                                                    |
| `src/Opf/Manifest.ts` | OPF `<manifest>` item list                                                                                                                |
| `src/Opf/Spine.ts`    | OPF `<spine>` reading order                                                                                                               |
| `src/Opf/Guide.ts`    | OPF `<guide>` landmarks                                                                                                                   |
| `src/Ops/`            | Returns the `application/epub+zip` MIME type string                                                                                       |
| `src/Toc/`            | EPUB 3 `<nav epub:type="toc">` with nested `<ol>` rendering                                                                               |
| `src/Xhtml/`          | XHTML page template: head, body, stylesheet/script link tags, cover SVG, LOI section                                                      |
| `src/Xml/`            | `META-INF/container.xml` template and mimetype string                                                                                     |
| `src/Project/`        | Scaffolding templates for new projects: directories, `toc.yml`, `metadata.yml`, starter Markdown, `config.yml`, `.gitignore`, `README.md` |
| `src/figures/`        | Figure markup dispatcher; delegates to `epub.ts`, `mobi.ts`, `reader.ts`, `web.ts` by media type and build target                         |
| `__tests__/`          | Jest snapshot tests for Toc, Xhtml, Xml, Project, and all figure variants                                                                 |
| `dist/`               | Compiled output (single bundle via tsdown; do not edit by hand)                                                                           |

## Dev Commands

```bash
npm test       # runs jest; includes snapshot tests for structural templates and figures
npm run build  # compile src/ → dist/ with tsdown (CJS)
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All template logic lives in `src/`; `dist/` is the compiled output and must not be edited by hand
- Template methods must return either a plain string or a Vinyl `File` object — not both interchangeably within the same class
- `{% body %}` is the placeholder convention used by the pipeline; do not change it
- Snapshot tests must be updated (`jest --updateSnapshot`) whenever template output intentionally changes
- Figure templates must handle all supported media types: image orientations (portrait, landscape, portrait-high, square), audio, video, iframe, vimeo

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the
root AGENTS.md. No tasks are currently open. To add a task, create
tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
