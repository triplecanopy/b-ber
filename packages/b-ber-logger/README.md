# `@canopycanopycanopy/b-ber-logger`

`b-ber-logger` is **b-ber**'s console logger.

## Install

```
npm i -g @canopycanopycanopy/b-ber-logger
```

## Usage

Output from `bber` commands can be logged to the console with different levels of verbosity.

### Arguments

#### `--quiet`

Emit nothing to the console. The `quiet` flag is an alias of `loglevel=0`.

```
bber build --quiet
bber build --log-level=0
```

#### `--warn`

Emit warnings and single-line error messages to the console. The `warn` flag is an alias of `loglevel=1`.

```
bber build --warn
bber build --log-level=1
```

#### `--error`

Emit warnings and stack traces for errors to the console. The `error` flag is an alias of `loglevel=2`.

```
bber build --error
bber build --log-level=2
```

#### `--verbose`

Emit messages, warnings, errors and stack traces to the console.

```
bber build --verbose
```

#### `--debug`

Emit stack traces for everything, as well as warnings and errors to the console.

```
bber build --debug
```
