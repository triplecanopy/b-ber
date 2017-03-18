
# Directory Structure

```yml
  cli/                # Dispatchers
  lib/                # Namespaces
  modifiers/          # Data transformation
  output/             # I/O operations
  plugins/            # Third party scripts embedded in core
  shapes/             # JSON assets
  templates/          # Output templates
  utils/              # Utility functions
```

# ES6 `import` Rules

All local modules resolve to absolute paths using [babel-plugin-module-resolver](https://github.com/tleunen/babel-plugin-module-resolver):

```js
// no
import utils from '../../../utils'

// yes
import utils from 'utils'
```

See aliases in the [.babelrc](https://github.com/triplecanopy/b-ber-creator/blob/master/.babelrc#L6).

# Application Lifecycle

  1. Command issued to `bber`
  * Initialize application loader
  * Configure application from user input and config files in the following order:
    1. `bber` defaults
    * `.config.yml`
    * Command line arguments
    * `<source-dir>/<build-type>.yml`
  * Execute commands
  * Deliver response
