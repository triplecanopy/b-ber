<h1 align="center">
    <img alt="b-ber" src="https://user-images.githubusercontent.com/4243474/38133122-2af4f794-340e-11e8-8ac9-9b46afecfd9b.png" width="450">
</h1>

[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io/)
[![npm Version](https://badge.fury.io/js/b-ber.svg)](https://badge.fury.io/js/b-ber)
[![Build Status](https://travis-ci.com/triplecanopy/b-ber.svg?token=d5sXqMpXEby4v8y2wENP&branch=master)](https://travis-ci.com/triplecanopy/b-ber)
[![Coverage Status](https://coveralls.io/repos/triplecanopy/b-ber/badge.svg?branch=master)](https://coveralls.io/r/<account>/<repository>?branch=master)

**b-ber** is an authoring environment application suite that generates an array of formats—ePubs, Mobis, PDFs, websites, and more—from canonical source documents written in markdown and custom syntax developed by Triple Canopy.

The `b-ber` repository is a monorepo that is managed with [Lerna](https://lernajs.io/). This means that a number of `b-ber` packages are published to `npm` from the same codebase.

## Installation 

Clone the repo and install dependencies.

If [`lerna`](https://github.com/lerna/lerna/) isn't already installed:

```console
$ npm i -g lerna
```

Then [install `yarn`](https://yarnpkg.com/en/docs/install/) according to documentation.  Note that using `npm` to install `yarn` is discouraged.

Run the following n the `b-ber` repo

```console
$ yarn
$ lerna bootstrap
```

### Running a Development version of `b-ber`

Create a symlink to `b-ber-create` either using `npm`, or by manually creating a symlink in the `.profile`

#### `npm` Method

This method will create a symlink in the global `node_modules` directory to the compiled code. Updates to the codebase will require re-linking the `b-ber` module.

Build the application from the `b-ber` repo

```console
$ lerna run build
```

Link the package

```console
$ cd packages/b-ber-cli
$ npm link bber
```

To re-link the module after changes, rebuild `b-ber` and run 

```console
$ npm rm -g bber
```

Then repeat the linking steps above.

#### `.profile` Method

Update the command below for your preferred profile file (`.profile`, `.bash_profile`, `.zshrc`, etc.). Protip: use an alias other than `bber` so that you know which module you're using in the future.

```console
$ echo "alias _bber=$(pwd)/packages/b-ber-cli/dist/index.js" >> ~/.profile
$ source ~/.profile
```

`b-ber` should now be globally available

```console
$ bber

    Usage: bber <command> [options]

    Where <command> is one of:
    ...

```

## Develop

Watch tasks are available in each of the package directories to use during development.

```console
$ cd packages/b-ber-package
$ yarn watch
```

Or watch all packages using `lerna` from the `b-ber` repo

```console
$ lerna run watch --no-sort --stream
```

More information about using `lerna` commands can be found [here](https://github.com/lerna/lerna/).

## Test

Run tests either in individual packages, or in all packages from the `b-ber` repo root using [`jest`](https://facebook.github.io/jest/).

```console
$ yarn jest
```

## Documentation

**[Demos](https://github.com/triplecanopy/b-ber/tree/master/demos)**        
**[User's manual](https://github.com/triplecanopy/b-ber/wiki)**

There are also **[READMEs](https://github.com/triplecanopy/b-ber/tree/master/packages)** in the `packages` directory with more detailed information.
