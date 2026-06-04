# AGENTS.md — b-ber-tasks

## What This Is

`b-ber-tasks` defines every individual build step in the b-ber pipeline. Each task is an async function (Promise-based) that reads from and writes to the shared `State` singleton in `b-ber-lib`. `b-ber-cli` composes these tasks into ordered sequences to produce EPUB, Mobi, PDF, web, reader, and XML builds. The package also includes tasks for serving output locally via browser-sync, deploying to remote hosts, and generating the Lunr full-text search index.

## Key Files

| File                             | Purpose                                                               |
| -------------------------------- | --------------------------------------------------------------------- |
| `src/index.ts`                   | Re-exports all task functions                                         |
| `src/render/index.ts`            | Converts Markdown source files to XHTML via `b-ber-markdown-renderer` |
| `src/opf/Opf.ts`                 | Generates the EPUB OPF package document                               |
| `src/opf/ManifestAndMetadata.ts` | Builds OPF manifest and Dublin Core metadata sections                 |
| `src/opf/Navigation.ts`          | Builds NCX / navigation document                                      |
| `src/container/`                 | Generates `META-INF/container.xml`                                    |
| `src/epub/`                      | Zips the OPS directory into a `.epub` file                            |
| `src/sass/`                      | Compiles SCSS to CSS with autoprefixer                                |
| `src/scripts/`                   | Bundles and minifies JavaScript assets                                |
| `src/copy/`                      | Copies static assets (images, fonts, media) into the build            |
| `src/cover/`                     | Generates the EPUB cover image entry                                  |
| `src/footnotes/`                 | Collects and renders footnote pages                                   |
| `src/loi/`                       | Generates the List of Illustrations page                              |
| `src/generate/`                  | Generates placeholder XHTML files for non-Markdown content            |
| `src/inject/`                    | Injects navigation and UI elements into rendered HTML                 |
| `src/init/`                      | Scaffolds a new b-ber project directory                               |
| `src/clean/`                     | Removes build output directories                                      |
| `src/mobi/`                      | Runs Calibre conversion to produce `.mobi`                            |
| `src/pdf/`                       | Produces PDF output                                                   |
| `src/web/`                       | Builds static website output including Lunr search index              |
| `src/reader/`                    | Builds reader-compatible output                                       |
| `src/xml/`                       | Builds InDesign XML output                                            |
| `src/sample/`                    | Builds sample (excerpt) output                                        |
| `src/serve/`                     | Starts a browser-sync dev server                                      |
| `src/deploy/`                    | Deploys build output to a remote host                                 |
| `src/validate/`                  | Validates directive syntax via `b-ber-validator`                      |
| `src/serialize.ts`               | Serialises the spine/TOC data structure                               |

## Dev Commands

```bash
npm test      # jest
npm run build # compile src/ → dist/ with tsdown, then copy.sh for browser-side JS assets
```

## Code Standards

This package follows the monorepo-wide standards in the root AGENTS.md.
Additional standards for this package:

- All tasks return Promises. Do not use callbacks.
- Tasks operate on the shared `state` singleton from `b-ber-lib/State`. Do not pass state as an argument.
- Some web-build files (`src/web/search.js`, `src/web/worker.js`, etc.) are excluded from tsdown compilation because they run in the browser; do not add ES module imports to those files.
- The `copy.sh` script copies non-JS source assets (e.g., web worker scripts) into `dist/` during build. If you add new non-JS files, update `copy.sh`.

## Task System

Tasks for this package are tracked in tasks/ using the same PRD format as the
root AGENTS.md. No tasks are currently open. To add a task, create
tasks/TASK-NNN.open.md following the format in the root AGENTS.md.
