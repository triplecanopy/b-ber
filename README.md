# b-ber-creator

[![Build Status](https://travis-ci.com/triplecanopy/b-ber-creator.svg?token=d5sXqMpXEby4v8y2wENP&branch=master)](https://travis-ci.com/triplecanopy/b-ber-creator)
[![Coverage Status](https://coveralls.io/repos/triplecanopy/b-ber-creator/badge.svg?branch=master)](https://coveralls.io/r/<account>/<repository>?branch=master)


A command-line epub maker.

## Install with [`yarn`](https://yarnpkg.com/)

```bash
$ git clone https://github.com/triplecanopy/b-ber-creator.git
$ cd b-ber-creator && yarn
```

## Install with [`npm`](https://www.npmjs.com/)

```bash
$ git clone https://github.com/triplecanopy/b-ber-creator.git
$ cd b-ber-creator && npm install
```

## Workflow

If working in a development environment, replace `bber` in the below commands with `npm start --`

```
Usage: bber <command> [options]

Where <command> is one of:
  build, clean, copy, create, editor, generate, init, inject, opf, pdf,
  publish, render, scripts, sass, serve, site, theme, watch, xml

Some common commands are:

  Creating books
    bber init       Create an empty project and file structure, defaults to `_book`
    bber generate   Create a new chapter. Accepts arguments for metadata.
    bber watch      Preview the book in a web-browser during development
    bber build      Create an ePub, mobi, PDF, or all file formats

  Viewing books
    bber site     Clone the bber-reader into `site`
    bber serve    Preview the compiled epub in the bber-reader

For more information on a command, enter bber <command> --help
```

See the [wiki](https://github.com/triplecanopy/b-ber-creator/wiki/CLI-Command-List#full-command-list) for a full list of commands.

## Commands via `bber`

Run CLI commnads with `bber` rather than `npm`. The `bber` command requires transpiled JSX in the `dist` directory during pre-production phases.

```bash
$ npm run build   # transpile JSX
$ npm link        # create simlink to bber/bin/cli
$ bber init       # `bber` is now available
```

## Testing

```bash
$ npm test
```

## Reference

Check out the [wiki](https://github.com/triplecanopy/b-ber-creator/wiki).

## Documentation

```bash
$ npm run documentation
```

And open `./documentation/bber/BBER_VERSION/index.html` in your browser.
