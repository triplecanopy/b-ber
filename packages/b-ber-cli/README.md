# `@canopycanopycanopy/b-ber-cli`

The b-ber CLI tool is called `bber`. `b-ber-cli` is the entry point for all of the `bber` commands.

## Install

```
$ npm i -g @canopycanopycanopy/b-ber-cli
```

### Usage

Information about the CLI tool can be displayed by running:

```
$ bber
```

Information about each of the commands can be displayed by running:

```
$ bber <command> --help
```

### Commands

#### `new`

The `new` command initiates a new project.

```
$ bber new <name>
```

#### `generate`

The `generate` command creates a new chapter.

```
$ bber generate <title> [type]
```

#### `serve`

The `serve` command previews a publication's contents in a browser.

```
$ bber serve <type>
```

#### `build`

The `build` command creates an EPUB, Mobi, PDF, or all file formats.

```
$ bber build [type]
```
