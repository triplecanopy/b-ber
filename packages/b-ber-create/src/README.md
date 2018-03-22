# Application Lifecycle (i.e., “How Does It Work?”)

```sh
$ bber build
```

1. `b-ber` loads its settings from configuration files and environment variables
2. The `build` command is sent to `yargs` (an optstrings parser) to be evaluated
3. If `build` is a valid command (it is), then `yargs` invokes the `build` handler with any arguments that were also passed in
4. The `build` handler calls the `build` task
5. The `build` task runs, calling all its constituent methods (`read` this, `write` that)
6. Messages are logged to the console to notify that either an error was encountered, or that everything went smoothly.

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
<tr><td><a href="https://github.com/triplecanopy/b-ber-creator/tree/master/src/vendor"><code>vendor</code></a><td>Third-party scripts that aren't (currently) available through a package manager</td></tr>
</table>
More detailed info is available in each of the sub-directories.

# Development Info

`b-ber` is written in JavaScript (ECMAScript 2015) using the [`babel`](http://babeljs.io/) presets `es2015, stage-0`. `b-ber` tries to rely as little as possible on external libraries or build systems, opting instead to delegate tasks using `npm start`.

The typical application flow triggers a succession of `Promises` using an async factory, and each `b-ber` task returns a `Promise` object. This abstracts away most issues arising from race-conditions, and allows `b-ber` to be easily extended in local, remote, or a combination of environments (or platforms!) while incurring relatively little additional overhead.

## Setting up the Development Environment



### Install `Node.js` and `yarn`

Or skip to the section below if you already have them available.

#### macOS

1. Download and install [Node.js](https://nodejs.org/en/download/)
1. Open Terminal.app
1. Copy and paste the following into the new Terminal window: `curl -o- -L https://yarnpkg.com/install.sh | bash` 
1. Press <kbd>RETURN</kbd>


#### Windows
[TK]

#### Linux

1. Download and install [Node.js](https://nodejs.org/en/)
1. Enter `curl -o- -L https://yarnpkg.com/install.sh | bash` in the shell and press <kbd>RETURN</kbd>

### Clone `b-ber`

Clone the repository and install dependencies:

```sh
$ git clone https://github.com/triplecanopy/b-ber-creator.git
$ cd b-ber-creator && yarn
```

Commands are now available in the CLI using by invoking `npm`'s `start` script:

```sh
$ yarn start --
```

```console
  Usage: bber <command> [options]

  Where <command> is one of:
    build, clean, copy, container, cover, generate, init, inject, opf, pdf, footnotes, publish, render, scripts, sass, serve, site, theme, watch, xml, create

  Some common commands are:

    Creating projects
      bber create     Start a new project
      bber generate   Create a new chapter. Accepts arguments for metadata.
      bber watch      Preview the publication's contents in a browser
      bber build      Create an ePub, mobi, PDF, or all file formats

  For more information on a command, enter bber <command> --help
```

### Running `b-ber` in Development Using `npm link`

Ensure that you're in the `b-ber-create` repository to link to the `b-ber` CLI commands

```sh
$ npm link
```

`b-ber` commands are now available globally using `bber`

```sh
$ pwd
  /path/to/b-ber-create-repo/
$ cd ../
$ bber create --name my-project
  info: Creating directory my-project
$ ls -1 my-project
  README.md
  _project
  config.yml
```

Before pulling changes to the b-ber-create repo un-link the global symlink

```sh
$ npm rm -g bber
$ git pull origin master
```

Once changes have been pulled, its necessary to re-install dependencies before re-linking

```sh
$ yarn
$ npm link
```

### Running `b-ber` in Development Using a `bash` Alias

Since `b-ber` requires all ES2015 to be transpiled before running, it's necessary to re-`npm link` every time an ES2015 file is changed. Therefore, creating simple `bash` alias to the `yarn start` command can speed up development.

The following aliases `_bber` to the `b-ber` repos `yarn start` command:

```sh
$ pwd
  /path/to/b-ber-create-repo/
$ echo alias=_bber=$(pwd)/node_modules/.bin/babel-node $(pwd)/src/bber-cli/index.es6 >> ~/.bash_profile
$ . ~/.bash_profile
$ cd ../
$ _bber

  Usage: bber <command> [options]
  ...
```

## Pragmatics

### `import` Rules

All local modules resolve to absolute paths using [babel-plugin-module-resolver](https://github.com/tleunen/babel-plugin-module-resolver):

```js
// no
import utils from '../../../bber-utils'

// yes
import utils from '@canopycanopycanopy/b-ber-lib/utils'
```

See aliases in the [.babelrc](https://github.com/triplecanopy/b-ber-creator/blob/master/.babelrc) under `module-resolver`.
