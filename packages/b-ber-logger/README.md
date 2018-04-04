# `b-ber-logger`

This is the console logger for `b-ber`.

`b-ber` supports flags to change the verbosity of output during build, which can be set with the `log-level` flag, from `0` (quiet) to `4` (verbose).

```console
$ bber build --epub --log-level=0 # quiet
$ bber build --epub --log-level=1 # error
$ bber build --epub --log-level=2 # warn
$ bber build --epub --log-level=3 # info (default)
$ bber build --epub --log-level=4 # verbose
```

`b-ber` also accepts some common aliases.

```console
$ bber build --epub --verbose # same as --log-level=4
$ bber build --epub --quiet # same as --log-level=0
```

A summary can be printed out at the end of the build process by using the `summary` flag. The summary contains information about the build time, metadata, and pagination.

```console
$ bber build --epub --summary
```

Flags can also be used in combination with one another.

```console
$ bber build --epub --summary --quiet
```
