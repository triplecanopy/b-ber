# AGENTS.md — b-ber-lib

## What This Is

`b-ber-lib` is the shared utility library used across the b-ber build pipeline. It provides the central `State` singleton (project configuration, spine, metadata, build-specific path helpers), `Config` (settings deep-merged from `config.yml` over defaults), `Spine`/`SpineItem` (ordered content navigation from `toc.yml`), `Theme` (SCSS theme resolution and loading), and a set of lower-level helpers for URL normalisation, HTML serialisation, YAML I/O, EPUB manifest properties, and Calibre ebook conversion. Virtually every other b-ber package depends on this package.

## Key Files

| File                            | Purpose                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/State.js`                  | Central build state singleton; holds config, spine, metadata, figures, footnotes, path helpers |
| `src/Config.js`                 | Constructs project config by deep-merging `config.yml` over defaults                           |
| `src/Spine.js`                  | Reads `toc.yml`; builds nested + flattened page-flow for each build type                       |
| `src/SpineItem.js`              | Data model for a single spine entry                                                            |
| `src/YamlAdaptor.js`            | Loads and queries YAML files; comment-preserving write-back via yawn-yaml                      |
| `src/Theme.js`                  | Resolves and loads built-in or user-defined SCSS themes                                        |
| `src/Template.js`               | Wraps rendered body content in the XHTML page template                                         |
| `src/Html.js`                   | HTML serialisation helpers                                                                     |
| `src/HtmlToXml.js`              | Converts HTML to valid XHTML                                                                   |
| `src/Url.js`                    | URL normalisation utilities                                                                    |
| `src/ManifestItemProperties.js` | Derives EPUB manifest `properties` attributes from content                                     |
| `src/GuideItem.js`              | Represents an EPUB guide reference entry                                                       |
| `src/EbookConvert.js`           | Shell wrapper for the Calibre `ebook-convert` binary                                           |
| `src/utils/`                    | Miscellaneous low-level helpers                                                                |
| `src/index.js`                  | Named re-exports of all public classes and modules                                             |

## Dev Commands

```bash
npm test      # jest
npm run build # babel transpile src/ → root (in-place)
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- `State` is a singleton exported as `export default new State()`. Do not instantiate it elsewhere; import the instance.
- `Config` constructor returns a plain object (via `defaultsDeep`) rather than a class instance; treat the result as a POJO.
- All file system operations use `fs-extra` rather than the native `fs` module.
- YAML files are loaded via `YamlAdaptor`, which wraps `js-yaml` and preserves comments on write via `yawn-yaml`.

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the
root AGENTS.md. No tasks are currently open. To add a task, create
tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
