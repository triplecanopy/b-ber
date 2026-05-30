# `@canopycanopycanopy/b-ber-tasks`

`b-ber-tasks` defines every individual build step in the b-ber pipeline. Each task is an async function (Promise-based) that reads from and writes to the shared `State` object in `b-ber-lib`. `b-ber-cli` composes these tasks into ordered sequences to produce EPUB, Mobi, PDF, web, reader, and XML builds. The package also includes tasks for serving the output locally via browser-sync, deploying to remote hosts, and generating the full-text Lunr search index.

## Key exports

| Export      | Purpose                                                    |
| ----------- | ---------------------------------------------------------- |
| `render`    | Converts Markdown source files to XHTML pages              |
| `opf`       | Generates the EPUB OPF (manifest, metadata, spine, guide)  |
| `container` | Creates the EPUB `META-INF/container.xml`                  |
| `epub`      | Zips the OPS directory into a `.epub` archive              |
| `sass`      | Compiles SCSS to CSS with autoprefixer                     |
| `scripts`   | Bundles and minifies JavaScript assets                     |
| `copy`      | Copies static assets (images, fonts, media) into the build |
| `cover`     | Generates the EPUB cover image entry                       |
| `footnotes` | Collects and renders footnote pages                        |
| `loi`       | Generates the List of Illustrations page                   |
| `generate`  | Generates placeholder XHTML files for non-Markdown content |
| `inject`    | Injects navigation and UI elements into rendered HTML      |
| `init`      | Scaffolds a new b-ber project directory                    |
| `clean`     | Removes build output directories                           |
| `mobi`      | Runs Calibre conversion to produce `.mobi`                 |
| `pdf`       | Produces PDF output                                        |
| `web`       | Builds the static website output                           |
| `reader`    | Builds the reader-compatible output                        |
| `xml`       | Builds the InDesign XML output                             |
| `sample`    | Builds the sample (excerpt) output                         |
| `serve`     | Starts a browser-sync dev server                           |
| `deploy`    | Deploys build output to a remote host                      |
| `validate`  | Validates directive syntax in Markdown source              |
| `serialize` | Serialises the spine/TOC data structure                    |

## Dev

```bash
npm test      # jest
npm run build
```
