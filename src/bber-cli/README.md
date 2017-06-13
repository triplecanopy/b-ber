# `bber-cli`

`bber-cli/index.es6` is the main entry point for all CLI commands. Commands are issued to `bber` via [`yargs`](https://www.npmjs.com/package/yargs), which then dispatches the appropriate handler in `bber-cli/cmd/`.

## Application Flow

```sh
$ bber init
```

1. The `init` command is passed to `bber-cli/index.es6`
2. `bber-cli/index.es6` looks up `bber-cli/cmd/init.es6` to see if an `init` task is registered
3. `bber` finds the handler in `bber-cli/cmd/init.es6`, and invokes its handler
4. The handler calls the appropriate function, in this case, `bber-output/init.es6`, passing along any additional arguments that may have been provided.

## Stand-Alone Commands

```sh
$ bber copy --in=/path/to/input --out=/path/to/output
```

Many `bber` commands can be run outside of a specific application flow. The above command, for example,  can be run anywhere to copy directory A to directory B.

## Compound Commands

```sh
$ bber build --epub
```

To achieve a synchronous flow, `bber` chains commands using `Promises`. The `build` command calls a sequence of `Promise`s serially to build an ebook. Every `bber` command returns a `Promise` object.

