import log from '@canopycanopycanopy/b-ber-logger'

// A failed command exits with this status. The CLI has one failure status:
// what went wrong is in the error it printed
const FAILURE = 1

// The one place a failed `bber` command becomes an exit status.
//
// b-ber-logger's `log.error` reports an error and returns it; it neither
// throws nor exits. Each call site stops itself, by throwing what it returns
// (`throw log.error(...)`) or rethrowing it from a promise chain's catch, and
// that travels up to a command handler, or out of a callback as an uncaught
// exception or unhandled rejection, and ends here. An error the logger has
// not seen yet (a bug, or a library's rejection that nothing caught) is
// printed first; `log.error` does not print one it has reported already.
//
// Exits at once rather than setting process.exitCode: a failed build can
// leave other work queued (sibling promises, a server, a file watcher) that
// would otherwise run on, or keep the process alive.
export function exitWithFailure(err: unknown): never {
  log.error(err)
  log.printFailure(FAILURE)
  return process.exit(FAILURE)
}

// Wraps a command's yargs handler so that a failure anywhere in it ends the
// process with status 1. The handler's own promise resolves with whatever the
// command returns.
export const exitOnFailure =
  <A, R>(handler: (argv: A) => R | Promise<R>) =>
  async (argv: A): Promise<R> => {
    try {
      return await handler(argv)
    } catch (err) {
      return exitWithFailure(err)
    }
  }

// Exits with status 1 when the process is about to die of an error nothing
// handled, through the logger rather than Node's stack dump
export function exitOnUncaughtFailure(): void {
  process.on('uncaughtException', exitWithFailure)
  process.on('unhandledRejection', exitWithFailure)
}

// A backstop: any error the logger reports makes the run's exit status 1,
// even if the code that reported it failed to stop and the run goes on to
// finish. It does not exit: if it did, call sites would stop only when the
// CLI is listening, and not in a test, a script or any other caller
export function exitCodeOnFailure(): void {
  log.on('failure', () => {
    process.exitCode = FAILURE
  })
}

// The yargs fail handler for every command, which yargs calls with a message
// for a usage error (a missing positional, a value that is not one of the
// choices) and with an error when a builder throws. A `.check` that returns
// a message (lib/arguments.ts) is a usage error too, and yargs passes that
// message as both arguments. A usage error shows the command's help, then the
// error. Either way the command exits 1.
//
// `yargs` is the command's own yargs instance, so that the help shown is the
// command's.
export function fail(
  msg: string,
  err: Error | string | null | undefined,
  yargs: { showHelp(): unknown }
): never {
  if (err instanceof Error) return exitWithFailure(err)
  yargs.showHelp()
  return exitWithFailure(new Error(msg))
}
