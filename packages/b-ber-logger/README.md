# `b-ber-logger`

This is the console logger for `b-ber`.

`b-ber-logger` supports flags to change the verbosity of output during build, which can be set with the `log-level` flag.

```
log-level=0 # No logging
log-level=1 # Error
log-level=2 # Warn (default)
log-level=3 # Info
log-level=4 # Verbose
```

`b-ber-logger` also supports the following flags:

```
no-color    # No console color
verbose     # Alias for log-level 4
quiet       # Alias for log-level 0
summary     # Prints a summary after build
```

## Example

```
$ bber build --epub --summary --verbose
```
