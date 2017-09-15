# `bber-lib`

`bber-lib/` contains higher-order functions that manage, depend upon, or otherwise interact with the application state.

- `bber-lib/props.es6` is a namespace for filtering files based on mime-type
- `bber-lib/serve.es6` invokes a [`nodemon`](https://www.npmjs.com/package/nodemon) server for proofing an ebook in a custom reader (*not yet implemented*)
- `bber-lib/theme.es6` manages SCSS theme packages found in `src/themes/`
- `bber-lib/watch.es6` invokes a [`nodemon`](https://www.npmjs.com/package/nodemon) server (`bber-lib/server.js`) for proofing an ebook in a browser

## Application State

_**TK: mention how the navigation and metadata are generated from values in the store object**_

`bber-lib/store.es6` contains `bber`’s configuration and state.

```sh
$ bber build
```

1. `bber` is invoked
2. `bber-lib/store.es6` is instantiated
3. `bber-lib/store.es6` loads configuration files and saves their data for use throughout the application lifecycle
4. The properties of `bber-lib/store.es6` are occasionally (and usually immutably) updated, such as when changing build systems

## Application Lifecycle

`bber-lib/async.es6` exports a `Promise` factory that is used to run `bber` commands in sequence.

```js
const sequence = [promise1, promise2, promise3]
serialize(sequence).then(() => {
  console.log('Done')
})
```
