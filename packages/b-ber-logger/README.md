# `@canopycanopycanopy/b-ber-logger`

`b-ber-logger` is the logging utility for the b-ber build pipeline. It exports a single `Logger` singleton (`log`) that all other packages import instead of using `console.log` directly. The logger supports levelled output (`info`, `warn`, `error`, `debug`, `trace`, `notice`, `inspect`), chalk-coloured formatting, indentation tracking across nested task steps, a build-run timer, end-of-run summary of collected warnings and errors, and quiet/verbose/debug modes driven by CLI flags (`--quiet`, `--verbose`, `--debug`, `--log-level=N`).

## Key exports

| Export          | Purpose                                                       |
| --------------- | ------------------------------------------------------------- |
| `log` (default) | Singleton `Logger` instance; import and call methods directly |

### Logger methods

| Method                    | Purpose                                            |
| ------------------------- | -------------------------------------------------- |
| `log.info(msg)`           | Standard informational output                      |
| `log.warn(msg)`           | Warning, collected for end-of-run summary          |
| `log.error(msg)`          | Error output, collected for end-of-run summary     |
| `log.debug(msg)`          | Debug output; enabled by `--debug` flag            |
| `log.trace(msg)`          | Trace-level output                                 |
| `log.notice(msg)`         | Notice-level output                                |
| `log.inspect(val)`        | Pretty-prints objects                              |
| `log.printSummary()`      | Prints collected warnings/errors at end of a build |
| `log.configure(opts)`     | Applies settings (logLevel, boringOutput, etc.)    |
| `log.registerSequence(n)` | Sets total task count for progress display         |

## Dev

```bash
npm test      # jest
npm run build
```
