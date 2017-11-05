# `bber-lib`

`bber-lib/` contains higher-order functions that manage, depend upon, or otherwise interact with the application state. The application state is stored in an instance of the [`Store` class](https://github.com/triplecanopy/b-ber/blob/master/packages/b-ber-create/src/bber-lib/store.es6).

- `bber-lib/props.es6` is a namespace for filtering files based on mime-type
- `bber-lib/serve.es6` invokes a [`nodemon`](https://www.npmjs.com/package/nodemon) server for viewing a publicatoin in a web browser
- `bber-lib/theme.es6` manages SCSS theme packages found in `src/themes/`

## Application State

`bber-lib/store.es6` contains `bber`’s configuration and state. When `b-ber` is invoked, the values in `store` are populated with values loaded from configuration files, and by the command line arguments. The example below outlines invokation.

```sh
$ bber build
```

1. `bber` is invoked
2. `bber-lib/store.es6` is instantiated
3. `bber-lib/store.es6` loads configuration files and saves their data for use throughout the application lifecycle


During the build process, some properties of `bber-lib/store.es6` are updated.

## Application Lifecycle

`bber-lib/async.es6` exports a `Promise` factory that is used to run `bber` commands in sequence.

```js
const sequence = [promise1, promise2, promise3]
serialize(sequence).then(() => {
  console.log('Done')
})
```
