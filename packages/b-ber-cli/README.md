# `@canopycanopycanopy/b-ber-cli`

The **b-ber** CLI tool is called `bber`. `b-ber-cli` is the entry point for all of the `bber` commands.

## Install

```
npm i -g @canopycanopycanopy/b-ber-cli
```

### Usage

Information about the CLI tool can be displayed by running

```
bber
```

Information about each of the commands can be displayed by running

```
bber <command> --help
```

### Commands

#### `new`

Start a new project.

```
bber new <name>
```

#### `generate`

Create a new chapter.

```
bber generate <title> [type]
```

#### `serve`

Preview the publication's contents in a browser.

```
bber serve <type>
```

#### `build`

Create an ePub, mobi, PDF, or all file formats.

```
bber build [type]
```
