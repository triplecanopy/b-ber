# `@canopycanopycanopy/b-ber-logger`

`b-ber-logger` is b-ber's console logger.

## Install

```
$ npm i -g @canopycanopycanopy/b-ber-logger
```

## Usage

Output from `bber` commands can be logged to the console with different levels of verbosity.

### Arguments

#### `--quiet`

The `--quiet` flag will emit nothing to the console and is an alias of `loglevel=0`.

```
$ bber build --quiet
$ bber build --log-level=0
```

#### `--warn`

The `---warn` flag will emit warnings and single-line error messages to the console and is an alias of `loglevel=1`.

```
$ bber build --warn
$ bber build --log-level=1
```

#### `--error`

The `--error` flag will emit warnings and stack traces for errors to the console and is an alias of `loglevel=2`.

```
$ bber build --error
$ bber build --log-level=2
```

#### `--verbose`

The `--verbose` flat will emit messages, warnings, errors and stack traces to the console.

```
$ bber build --verbose
```

#### `--debug`

The `--debug` flag will emit stack traces for everything, as well as warnings and errors to the console.

```
$ bber build --debug
```
