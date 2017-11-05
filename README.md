# `b-ber`

The `b-ber` repository is a monorepo that is managed with [Lerna](https://lernajs.io/). This means that a number of `b-ber` packages are published to `npm` from the same codebase.

## Installation

Clone the repo and install dependencies.

If [`lerna`](https://github.com/lerna/lerna/) isn't already installed:

```console
$ npm i -g lerna
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
