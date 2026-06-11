# AGENTS.md — b-ber-lib

## What This Is

`b-ber-lib` is the shared utility library used across the b-ber build pipeline. It provides the central `State` singleton (project configuration, spine, metadata, build-specific path helpers), `Config` (settings deep-merged from `config.yml` over defaults), `Spine`/`SpineItem` (ordered content navigation from `toc.yml`), `Theme` (SCSS theme resolution and loading), and a set of lower-level helpers for URL normalisation, HTML serialisation, YAML I/O, EPUB manifest properties, and Calibre ebook conversion. Virtually every other b-ber package depends on this package.

## Key Files

| File                            | Purpose                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| `src/State.ts`                  | Central build state singleton; holds config, spine, metadata, figures, footnotes, path helpers |
| `src/Config.ts`                 | Constructs project config by deep-merging `config.yml` over defaults                           |
| `src/Spine.ts`                  | Reads `toc.yml`; builds nested + flattened page-flow for each build type                       |
| `src/SpineItem.ts`              | Data model for a single spine entry                                                            |
| `src/YamlAdaptor.ts`            | Loads and queries YAML files; comment-preserving write-back via yawn-yaml                      |
| `src/Theme.ts`                  | Resolves and loads built-in or user-defined SCSS themes                                        |
| `src/Template.ts`               | Wraps rendered body content in the XHTML page template                                         |
| `src/Html.ts`                   | HTML serialisation helpers                                                                     |
| `src/HtmlToXml.ts`              | Converts HTML to valid XHTML                                                                   |
| `src/Url.ts`                    | URL normalisation utilities                                                                    |
| `src/ManifestItemProperties.ts` | Derives EPUB manifest `properties` attributes from content                                     |
| `src/GuideItem.ts`              | Represents an EPUB guide reference entry                                                       |
| `src/EbookConvert.ts`           | Shell wrapper for the Calibre `ebook-convert` binary                                           |
| `src/utils/`                    | Miscellaneous low-level helpers                                                                |
| `src/index.ts`                  | Named re-exports of all public classes and modules                                             |

## Dev Commands

```bash
npm test      # jest
npm run build # compile src/ → dist/ with tsdown (CJS)
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- `State` is a singleton exported as `export default new State()`. Do not instantiate it elsewhere; import the instance.
- `Config` constructor returns a plain object (via `defaultsDeep`) rather than a class instance; treat the result as a POJO.
- All file system operations use `fs-extra` rather than the native `fs` module.
- YAML files are loaded via `YamlAdaptor`, which wraps `js-yaml` and preserves comments on write via `yawn-yaml`.
