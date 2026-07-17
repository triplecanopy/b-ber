# `@canopycanopycanopy/b-ber-lib`

`b-ber-lib` is the shared utility library used across the b-ber build pipeline. It provides the central `State` singleton (project configuration, spine, metadata, and src/dist path helpers), `Config` (settings merged from `config.yml`), `Spine` and `SpineItem` (ordered content navigation built from `toc.yml`), `Theme` (SCSS theme loading), and a set of lower-level helpers for URL normalisation, HTML serialisation, YAML I/O, EPUB manifest properties, and Calibre ebook conversion. Virtually every other b-ber package depends on this package.

## Key exports

| Export                   | Purpose                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `State`                  | Singleton holding full build state: config, spine, metadata, figures, footnotes, src/dist path helpers |
| `Config`                 | Constructs project config by deep-merging `config.yml` over defaults                                   |
| `Spine` / `SpineItem`    | Reads `toc.yml`; produces nested and flattened page-flow for each build type                           |
| `YamlAdaptor`            | Loads and queries YAML files; supports comment-preserving write-back via yawn-yaml                     |
| `Html` / `HtmlToXml`     | Helpers for serialising and converting HTML to XHTML                                                   |
| `Url`                    | URL normalisation utilities                                                                            |
| `Theme`                  | Resolves and loads built-in or user-defined SCSS themes                                                |
| `Template`               | Wraps rendered body content in the XHTML page template                                                 |
| `ManifestItemProperties` | Derives EPUB manifest `properties` attributes from content                                             |
| `GuideItem`              | Represents an EPUB guide reference entry                                                               |
| `EbookConvert`           | Shell wrapper for the Calibre `ebook-convert` binary                                                   |
| `utils`                  | Miscellaneous low-level helpers                                                                        |

## Dev

```bash
npm test      # jest
npm run build
```
