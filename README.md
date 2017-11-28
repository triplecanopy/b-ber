# `b-ber`

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![npm Version](https://badge.fury.io/js/b-ber.svg)](https://badge.fury.io/js/b-ber)
[![Build Status](https://travis-ci.com/triplecanopy/b-ber.svg?token=d5sXqMpXEby4v8y2wENP&branch=master)](https://travis-ci.com/triplecanopy/b-ber)
[![Coverage Status](https://coveralls.io/repos/triplecanopy/b-ber/badge.svg?branch=master)](https://coveralls.io/r/<account>/<repository>?branch=master)

**b-ber** is an authoring environment application suite that generates an array of formats—ePubs, Mobis, PDFs, websites, and more—from canonical source documents written in markdown and custom syntax developed by Triple Canopy.

The `b-ber` repository is a monorepo that is managed with [Lerna](https://lernajs.io/). This means that a number of `b-ber` packages are published to `npm` from the same codebase.

## Installation

Clone the repo and install dependencies.

If [`lerna`](https://github.com/lerna/lerna/) or [`yarn`](https://yarnpkg.com/) isn't already installed:

```console
$ npm i -g lerna
$ npm i -g yarn
```

Then, in the `b-ber` repo

```console
$ yarn
$ lerna bootstrap
```

Once that's done, create a global symlink to `b-ber-create`

```console
$ cd packages/b-ber-create
$ npm link
```

The `bber` command is now available!

```console
$ bber

    Usage: bber <command> [options]

    Where <command> is one of:
    ...

```

## Updates

After pulling changes from the `b-ber` repo, you'll need to re-`npm link` the `b-ber-create` repo.

```console
$ npm rm -g bber
$ cd /path/to/b-ber-create/
$ npm link
```

## Documentation

**[Demos](https://github.com/triplecanopy/b-ber/tree/master/demos)**        
**[User's manual](https://github.com/triplecanopy/b-ber/wiki)**

There are also **[READMEs](https://github.com/triplecanopy/b-ber/tree/master/packages)** in the `packages` directory with more detailed information.
