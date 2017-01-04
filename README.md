# b-ber-creator

[![Build Status](https://travis-ci.com/triplecanopy/b-ber-creator.svg?token=d5sXqMpXEby4v8y2wENP&branch=master)](https://travis-ci.com/triplecanopy/b-ber-creator)

A command-line epub maker.

## Installation

```bash
$ git clone https://github.com/triplecanopy/b-ber-creator.git
$ cd b-ber-creator && npm install
```

## Workflow

If working in a development environment, replace `bber` in the below commands with `npm start --`

```bash
$ bber init     # Initialize the directory structure for the book
$ bber epub     # Create an Epub file
$ bber mobi     # Create an Mobi file
$ bber site     # Download Gomez and install dependencies
$ bber publish  # Move epub to _site directory
```

## Development

```
Usage: lib/cli.jsx <command> [options]

Commands:
  create   Create an Epub dir structure
  markit   Convert markdown to XHTML
  watch    Preview a book in the browser
  serve    Preview a book in the reader
  scripts  Compile the scripts
  render   Render layouts
  sass     Compile SCSS
  inject   Inject scripts and styles
  copy     Copy static assets to output dir
  opf      Generate the opf
  clean    Remove the `book` dir
  build    Build the `book` dir
  site     Download bber-boiler
  init     Initalize b-ber
  publish  Move book to the _site dir
  epub     Create an Epub
  mobi     Create a Mobi
  editor   Start web-based editor

Examples:
  lib/cli.jsx create [options]

For more information on a command, enter lib/cli.jsx <command> --help
```

## Commands via `bber`

Run CLI commnads with `bber` rather than `npm`. The `bber` command requires transpiled JSX in the `dist` directory during pre-production phases.

```bash
$ npm run build   # transpile JSX
$ npm link        # create simlink to bber/bin/cli
$ bber init       # `bber` is now available
```

## Testing

```
$ npm test
```
