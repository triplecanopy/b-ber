import { EventEmitter } from 'node:events'
import util from 'node:util'
import { composeMessage } from './format'
import { createReporter } from './reporters'
import Timer from './Timer'
import {
  type BuildPlan,
  LEVEL,
  type LogEntry,
  type LoggerEvents,
  type LoggerOptions,
  type LogMessage,
  type Reporter,
  type ReporterName,
  type ReporterSource,
} from './types'

export { floatFormat, formatDuration } from './format'
export type {
  BuildPlan,
  DoneEvent,
  LogEntry,
  LoggerOptions,
  LogMessage,
  ReporterName,
} from './types'

// What `log.error` returns when it is given something other than an Error.
// Errors it is given are returned as they are
class ReportedError extends Error {
  name = 'ReportedError'
}

// The b-ber build logger. Records the warnings and errors it is given, emits
// every message and the build's progress as events, and times the build's
// tasks. It does not write: a reporter listens to the events and draws them
// (see reporters/). The default reporter prints a line per message.
//
// `log.error` reports an error, emits it as `failure`, and returns it. It
// neither throws nor exits: the code that calls it stops itself
// (`throw log.error(...)`), and whether the process exits is b-ber-cli's
// decision (see its lib/exit.ts).
//
// The logging methods are arrow-function properties rather than prototype
// methods so that callers can pass them around unbound, as in
// `promise.then(log.notice)`.
class Logger extends EventEmitter<LoggerEvents> implements ReporterSource {
  logLevel: number = LEVEL.warn
  boringOutput = false
  summary = false

  // Everything reported since the last `reset`
  errors: LogEntry[] = []
  warnings: LogEntry[] = []

  // Counts for the task currently running, reset on `begin`
  task: unknown = null
  taskWarnings = 0
  taskErrors = 0

  private timer = new Timer()

  // The errors `log.error` has reported, so that one which is rethrown and
  // reported again by an outer handler on its way up prints once
  private reported = new WeakSet<object>()

  private reporterName: ReporterName = 'lines'
  private reporter: Reporter

  constructor(options: LoggerOptions = {}) {
    super()
    // Before the reporter's: the counts are reset before anything draws them
    this.on('begin', this.onBegin)

    this.reporter = createReporter(this.reporterName, this)
    this.configure(options)
  }

  // Applies the options that are set; leaves the others as they are
  configure(options: LoggerOptions): void {
    if (options.logLevel !== undefined) this.logLevel = options.logLevel
    if (options.boringOutput !== undefined) {
      this.boringOutput = options.boringOutput
    }
    if (options.summary !== undefined) this.summary = options.summary
    if (options.reporter && options.reporter !== this.reporterName) {
      this.reporter.detach()
      this.reporterName = options.reporter
      this.reporter = createReporter(options.reporter, this)
    }
  }

  reset(): void {
    this.errors = []
    this.warnings = []
  }

  // Logging

  // Reports an error and returns it. It does not throw and does not exit:
  // stopping is the caller's job, so every call site ends its own code path,
  // with `throw log.error(...)` (or a `return`), and a promise chain keeps its
  // rejection with `.catch((err) => { throw log.error(err) })`.
  //
  // Each error it reports is recorded, emitted as a `message` for the reporter
  // to print, and emitted as `failure`, at every log level.
  //
  // One argument that is an array reports each element as its own error, and
  // returns one error with all their messages. Anything else is one error: an
  // Error, which is returned as it is, or a message with util.format
  // placeholders and its values, which becomes a ReportedError. An error that
  // has been reported already is returned without being printed, recorded or
  // emitted again, so that one which is rethrown and reported again on its
  // way up prints once
  error = (...args: unknown[]): Error => {
    const [first] = args
    if (args.length === 1 && this.isReported(first)) return first

    const groups: unknown[][] =
      args.length === 1 && Array.isArray(first)
        ? first.map((entry) => [entry])
        : [args]
    const errors = groups.map((group) => this.reportOne(group))

    let error = errors[0]
    if (errors.length !== 1) {
      error = new ReportedError(errors.map((e) => e.message).join('\n'))
      this.reported.add(error)
    }

    this.emit('failure', error)
    return error
  }

  // Whether `value` is an error that `log.error` has already reported
  isReported = (value: unknown): value is Error =>
    typeof value === 'object' && value !== null && this.reported.has(value)

  // Recorded at every level; the reporter decides whether it is shown
  warn = (...args: unknown[]): void => {
    const messageArgs = withoutError(args)
    const { stack } = new Error()

    this.taskWarnings += 1
    this.warnings.push({ stack, message: composeMessage(messageArgs) })
    this.message({ kind: 'warn', args: messageArgs, stack })
  }

  // A message that is shown unless the output is quiet
  notice = (...args: unknown[]): void => {
    this.message({ kind: 'notice', args })
  }

  // Detail, shown at `--verbose`
  info = (...args: unknown[]): void => {
    if (this.logLevel < LEVEL.verbose) return
    // Only at `--debug`, which prints it: capturing one costs
    const stack = this.logLevel >= LEVEL.debug ? new Error().stack : undefined
    this.message({ kind: 'info', args, stack })
  }

  // Both no-ops. Callers pass the message they would log
  debug = (..._args: unknown[]): void => {}
  trace = (..._args: unknown[]): void => {}

  // Prints any value in full, for debugging
  inspect = (value: unknown): void => {
    this.message({ kind: 'inspect', args: [value] })
  }

  // The CLI is about to exit with `code` after a failure. The reporter ends
  // its output with that
  printFailure(code: number): void {
    this.emit('exit', { code })
  }

  printVersion(version: string): void {
    this.notice('version %s', version)
  }

  // Announces the formats a build is about to run, and each one's tasks
  registerSequence(plan: BuildPlan[]): void {
    this.emit('sequence', plan)
  }

  // Build progress
  //
  // b-ber-tasks' `step` calls these, through `notify`, around each step
  // and once each format has run. Each emits an event, which the reporter
  // draws. The events are the extension point: anything that wants to follow
  // a build's progress can listen for them

  notify(event: 'start' | 'stop', task: unknown): void
  notify(event: 'done', data: { state: unknown }): void
  notify(event: 'start' | 'stop' | 'done', data: unknown): void {
    if (event === 'done') this.done(data as { state: unknown })
    else this[event](data)
  }

  start(task: unknown): void {
    this.timer.start()
    this.emit('begin', { task })
  }

  stop(task: unknown): void {
    const taskTime = this.timer.stop(util.format(task))
    this.emit('end', { task, taskTime })
  }

  done({ state }: { state: unknown }): void {
    this.emit('done', { state, ...this.timer.done() })
  }

  private onBegin = ({ task }: { task: unknown }): void => {
    this.task = task
    this.taskWarnings = 0
    this.taskErrors = 0
  }

  private message(message: LogMessage): void {
    this.emit('message', message)
  }

  private reportOne(args: unknown[]): Error {
    const [first] = args
    const error =
      first instanceof Error && args.length === 1
        ? first
        : new ReportedError(composeMessage(args))

    const messageArgs = withoutError(args)

    this.taskErrors += 1
    this.errors.push({
      stack: error.stack,
      message: composeMessage(messageArgs),
    })
    this.reported.add(error)
    this.message({ kind: 'error', args: messageArgs, stack: error.stack })

    return error
  }
}

// An Error is reported by its message
const withoutError = (args: unknown[]): unknown[] =>
  args[0] instanceof Error ? [args[0].message] : args

export default Logger
