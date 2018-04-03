<h1 align="center">
    <img alt="b-ber" src="https://user-images.githubusercontent.com/4243474/38133122-2af4f794-340e-11e8-8ac9-9b46afecfd9b.png" width="450">
</h1>

<p align="center">
<a href="https://lernajs.io/" rel="nofollow"><img src="https://camo.githubusercontent.com/ecafd86d8356a1adc60fb4fd393bcc7584187f99/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f6d61696e7461696e6564253230776974682d6c65726e612d6363303066662e737667" alt="lerna" data-canonical-src="https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg" style="max-width:100%;"></a>
<a href="https://badge.fury.io/js/b-ber" rel="nofollow"><img src="https://camo.githubusercontent.com/39a84f89aa30b693d74ef2d7e9458eabefecbeeb/68747470733a2f2f62616467652e667572792e696f2f6a732f622d6265722e737667" alt="npm Version" data-canonical-src="https://badge.fury.io/js/b-ber.svg" style="max-width:100%;"></a>
<a href="https://travis-ci.com/triplecanopy/b-ber" rel="nofollow"><img src="https://camo.githubusercontent.com/daa5cbc9c439f3359f3e965cac4accc72b13334d/68747470733a2f2f7472617669732d63692e636f6d2f747269706c6563616e6f70792f622d6265722e7376673f746f6b656e3d64357358714d7058456279347638793277454e50266272616e63683d6d6173746572" alt="Build Status" data-canonical-src="https://travis-ci.com/triplecanopy/b-ber.svg?token=d5sXqMpXEby4v8y2wENP&amp;branch=master" style="max-width:100%;"></a>
<a href="https://coveralls.io/r/%3Caccount%3E/%3Crepository%3E?branch=master" rel="nofollow"><img src="https://camo.githubusercontent.com/7486c7bf19a1b36a8c836f81e02453b9f84598e0/68747470733a2f2f636f766572616c6c732e696f2f7265706f732f747269706c6563616e6f70792f622d6265722f62616467652e7376673f6272616e63683d6d6173746572" alt="Coverage Status" data-canonical-src="https://coveralls.io/repos/triplecanopy/b-ber/badge.svg?branch=master" style="max-width:100%;"></a>
</p>

**b-ber** is an authoring environment application suite that generates an array of formats—ePubs, Mobis, PDFs, websites, and more—from canonical source documents written in markdown and custom syntax developed by Triple Canopy.

The `b-ber` repository is a monorepo that is managed with [Lerna](https://lernajs.io/). This means that a number of `b-ber` packages are published to `npm` from the same codebase.

## Installation 

Clone the repo and install dependencies.

If [`lerna`](https://github.com/lerna/lerna/) isn't already installed:

```console
$ npm i -g lerna
```

Then [install `yarn`](https://yarnpkg.com/en/docs/install/) according to documentation.  Note that using `npm` to install `yarn` is discouraged.

Run the following in the `b-ber` repo

```console
$ yarn
$ lerna bootstrap
```

### Running a Development version of `b-ber`

Create a symlink to `b-ber-cli` either using `npm`, or manually by adding it to your `.profile`.

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

Then repeat the linking step above.

#### `.profile` Method

Update the command below for your preferred profile file (`.profile`, `.bash_profile`, `.zshrc`, etc.). Protip: use an alias other than `bber` so that you know which module you're referencing in the future.

```console
$ echo "alias _bber=\"$(pwd)/node_modules/.bin/babel-node $(pwd)/packages/b-ber-cli/dist/index.js"\" >> ~/.profile
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
$ yarn watch
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
