# `b-ber`


## Installation

Clone the repo and install dependencies.

If [`lerna`](https://github.com/lerna/lerna/) isn't already installed:

```console
$ npm i -g lerna
```

Then, in the root directory

```console
$ yarn 
$ lerna bootstrap
```

Once that's done, create a global symlink to `b-ber` 

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
