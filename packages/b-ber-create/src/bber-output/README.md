# `bber-output`

_**TK: mention how the navigation and metadata are generated from values in the store object**_

`bber-output/` contains a list of tasks that perform I/O operations. If a task exists here, it is likely registered with `yargs` in [`bber-cli`](https://github.com/triplecanopy/b-ber-creator/tree/master/src/bber-cli/cmd), and can be run on the command line.

Some more involved commands call eachother, or trigger a chain of dependencies before themselves running.

```sh
$ bber opf
```

1. Passes the `opf` command to `yargs` in `bber-cli`
2. Invokes the handler registered with the `opf` task in `bber-cli/cmd`
3. `bber-output/opf/index.es6`, the registered handler for the `opf` command, is then called
4. `bber-output/opf/index.es6` simultaneously calls `bber-output/opf/manifest-metadata.es6` and `bber-output/opf/navigation.es6`
5. The responses from `manifest-metadata` and `navigation` are merged once both tasks have completed, and the result is passed back to `bber-output/opf/index.es6` for further processing
6. The `content.opf` file is then written to disk

## Design

`b-ber` commands always return a `Promise`, and handle their own errors. Commands are chained together with a `Promise` factory at runtime, which outputs any errors encountered, and invokes the next command (if any).

The following is a minimal example of a function that reads from a Markdown file, and, uselessly, writes the data directly to an XHTML file.

```js
import fs from 'fs'

const input = () =>
  new Promise(resolve =>
    fs.readFile('./my-file.md', 'utf8', (err, data) => {
      if (err) { throw err }
      resolve(data)
    })
  )

const output = (data) =>
  new Promise(resolve =>
    fs.writeFile('./my-file.xhtml', data, (err) => {
      if (err) { throw err }
      resolve()
    })
  )

const myFunc = () =>
  new Promise(resolve =>
    input()
    .then(output)
    .catch(err => console.error(err))
    .then(resolve)
  )

export default myFunc
```

After extending the command list in `bber-cli`, and defining a handler in `bber-cli/cmd`, the `myFunc` module could be inserted into a sequence of other `b-ber` commands.

```js
import { serialize } from 'bber-lib/async'

const sequence = ['clean', 'myFunc', 'render']
serialize(sequence).then(() => {
  console.log('Done')
})
```
