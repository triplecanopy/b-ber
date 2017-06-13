# Application Lifecycle (i.e., “How Does It Work?”)

```sh
$ bber init
```

1. `b-ber` loads its settings from configuration files and environment variables
2. The `init` command is sent to `yargs` (an optstrings parser) to be evaluated
3. If `init` is a valid command (it is), then `yargs` invokes the `init` handler with any arguments that were also passed in
4. The `init` handler calls the `init` task
5. The `init` task runs, calling all its constituent methods (`read` this, `write` that)
6. When finished, it delivers a message that either an error was encountered, or that everything went smoothly.

# Directory Structure

<table>
<tr><td><a href="https://github.com/triplecanopy/b-ber-creator/tree/master/src/bber-cli"><code>bber-cli</code></a></td><td>Interpret CLI commands and dispatch actions</td></tr>
<tr><td><a href="https://github.com/triplecanopy/b-ber-creator/tree/master/src/bber-lib"><code>bber-lib</code></a></td><td>Namespaces for interacting with the application state</td></tr>
<tr><td><a href="https://github.com/triplecanopy/b-ber-creator/tree/master/src/bber-modifiers"><code>bber-modifiers</code></a></td><td>Manipulating the (X)HTML output from once it's rendered from Markdown</td></tr>
<tr><td><a href="https://github.com/triplecanopy/b-ber-creator/tree/master/src/bber-output"><code>bber-output</code></a></td><td>I/O operations, mostly reading and writing files</td></tr>
<tr><td><a href="https://github.com/triplecanopy/b-ber-creator/tree/master/src/bber-plugins"><code>bber-plugins</code></a></td><td>Extensions to the Markdown parser and renderer</td></tr>
<tr><td><a href="https://github.com/triplecanopy/b-ber-creator/tree/master/src/bber-shapes"><code>bber-shapes</code></a></td><td>Simple objects and arrays referenced by the application</td></tr>
<tr><td><a href="https://github.com/triplecanopy/b-ber-creator/tree/master/src/bber-templates"><code>bber-templates</code></a></td><td>Templates for exporting Markdown to (X)HTML</td></tr>
<tr><td><a href="https://github.com/triplecanopy/b-ber-creator/tree/master/src/bber-utils"><code>bber-utils</code></a></td><td>Utility functions</td></tr>
<tr><td><a href="https://github.com/triplecanopy/b-ber-creator/tree/master/src/vendor)</td"><code>vendor</code></a><td>Third-party scripts that aren't (currently) available through a package manager</td></tr>
</table>
More detailed info is available in each of the sub-directories.

# Development Info

`b-ber` is written entierly in JavaScript (ECMAScript 2015) using the [`babel`](http://babeljs.io/) presets `es2015, stage-0`. `b-ber` tries to rely as little as possible on external libraries or build systems, opting instead to delegate tasks using `npm start`.

The typical application flow triggers a succession of `Promises` using an async factory, and each `b-ber` task returns a `Promise` object. This abstracts away most issues arising from race-conditions, and allows `b-ber` to be easily extended in local, remote, or a combination of environments (or platforms!) while incurring relatively little additional overhead.

## Pragmatics

### `import` Rules

All local modules resolve to absolute paths using [babel-plugin-module-resolver](https://github.com/tleunen/babel-plugin-module-resolver):

```js
// no
import utils from '../../../bber-utils'

// yes
import utils from 'bber-utils'
```

See aliases in the [.babelrc](https://github.com/triplecanopy/b-ber-creator/blob/master/.babelrc) under `module-resolver`.

### ...

## Obligatory Cat

!['Obligacat'](https://s-media-cache-ak0.pinimg.com/736x/d1/54/76/d15476f7949d1697f3ed453b19a70ef0.jpg)
