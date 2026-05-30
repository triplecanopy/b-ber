# `@canopycanopycanopy/b-ber-cli`

`b-ber-cli` is the command-line entry point for the b-ber build framework. It installs a `bber` binary that accepts commands to scaffold new projects, generate chapters, build output in multiple formats (EPUB, Mobi, PDF, reader, web), preview output in a browser, manage themes, generate cover images, deploy builds to S3, and validate project Markdown. Commands are parsed with yargs; each command delegates its work to `@canopycanopycanopy/b-ber-tasks`.

## Commands

| Command    | Syntax                                              | Description                                                   |
| ---------- | --------------------------------------------------- | ------------------------------------------------------------- |
| `new`      | `bber new <name>`                                   | Scaffold a new b-ber project                                  |
| `generate` | `bber generate <title> [type]`                      | Create a new chapter (frontmatter, bodymatter, or backmatter) |
| `build`    | `bber build [epub\|mobi\|pdf\|reader\|sample\|web]` | Build one or all output formats                               |
| `serve`    | `bber serve [reader\|web]`                          | Preview a build in the browser                                |
| `check`    | `bber check [project]`                              | Validate project Markdown                                     |
| `cover`    | `bber cover`                                        | Generate a project cover image                                |
| `theme`    | `bber theme <set\|list> [name]`                     | Set or list available themes                                  |
| `deploy`   | `bber deploy [builds...]`                           | Upload builds to Amazon S3                                    |
| `opf`      | `bber opf`                                          | Generate the OPF package document                             |

Most commands accept a `--config <path>` flag pointing to a JSON or YAML file that extends the base project configuration.

## Dev

```bash
npm test        # jest unit tests (tests in __tests__/commands/)
npm run build   # compile src/ → dist/ with Babel
npm start       # run via babel-node without compiling
```
