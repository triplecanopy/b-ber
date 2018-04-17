# `b-ber-tasks`

`b-ber-tasks` exports methods for performing IO operations which are invoked by `b-ber-cli`. Most of the tasks here can be run from the command line with `bber` using `b-ber-cli`.

Tasks can be chained, and return `Promises`. Some `bber` commands will invoke a chain of tasks. See the example below for details.

```sh
$ bber opf
```

1. Passes the `opf` command to `yargs` in `b-ber-cli`
2. Invokes the handler registered with the `opf` task in `bber-cli/dist/cmd`
3. The method exported from `b-ber-tasks/opf/index.js` has been registered as the handler for the `opf` command and is called
4. `b-ber-tasks/opf/index.js` simultaneously calls `b-ber-tasks/opf/ManifestAndMetadata.js` and `b-ber-tasks/opf/Navigation.js` using `Promise.all`
5. The responses from `ManifestAndMetadata` and `Navigation` are merged once both tasks have completed, and the result is passed back to `b-ber-tasks/opf/index.js` for further processing
6. The `content.opf` file is then written to disk

## Design

Tasks are chained together with a `Promise` reducer at runtime, which invokes the next command once the current command resolves, or halts due to errors using `Promise.catch`. 

The following is a minimal example of a task that reads from a Markdown file and then writes the data directly to an HTML file.

```js
import fs from 'fs'

const input = _ => new Promise((resolve, reject) =>
  fs.readFile('./my-file.md', 'utf8', (err, data) => {
    if (err) return reject(err)
    resolve(data)
  })
)

const output = data => new Promise((resolve, reject) =>
  fs.writeFile('./my-file.xhtml', data, err => {
    if (err) return reject(err)
    resolve()
  })
)

const myFunc = _ => new Promise(resolve =>
  input()
    .then(output)
    .catch(err => console.error(err.message))
    .then(resolve)
)

export default myFunc
```

The `myFunc` module could be inserted into a sequence of other `b-ber` commands by extending the command list in `b-ber-cli`, and defining a handler in `b-ber-cli/cmd`.

```js
// Import the Promise reducer
import {serialize} from '@canopycanopycanopy/b-ber-tasks/async' 

// Define a sequence
const sequence = ['clean', 'myFunc', 'render']

// Run tasks serially
serialize(sequence).then(_ => console.log('Done'))
```
