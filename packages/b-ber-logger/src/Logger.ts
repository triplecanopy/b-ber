import { EventEmitter } from 'node:events'
import util from 'node:util'
import chalk from 'chalk'
import Timer, { type RunTime, type TaskTime } from './Timer'

// What each log level shows. Each level shows everything the ones below it do
//
//   0  quiet    nothing
//   1  error    errors and notices (e.g. "Build succeeded")
//   2  warn     warnings (the default)
//   3  info     a line for each finished task, and a timestamp on every line
//   4  verbose  info, and the stack trace of each warning and error
//   5  debug    the stack trace of each info line
const LEVEL = {
  quiet: 0,
  error: 1,
  warn: 2,
  info: 3,
  verbose: 4,
  debug: 5,
} as const

export interface LoggerOptions {
  // 0–5, see LEVEL
  logLevel?: number
  // Plain text, no ANSI colour
  boringOutput?: boolean
  // Print the build's stats, configuration, metadata and navigation when it
  // succeeds
  summary?: boolean
}

export interface LogEntry {
  message: string
  stack: string | undefined
  formatted: string
}

type Style =
  | 'black'
  | 'blueBright'
  | 'gray'
  | 'green'
  | 'whiteBright'
  | 'bgBlack'
  | 'bgRed'
  | 'bgYellowBright'

// One label per kind of line, all four characters wide, so the messages line
// up and the kinds are told apart by the word itself, without colour
type Label = 'error' | 'warn' | 'info'
const LABELS: Record<Label, [string, ...Style[]]> = {
  error: ['ERR!', 'whiteBright', 'bgRed'],
  warn: ['WARN', 'black', 'bgYellowBright'],
  info: ['info', 'green'],
}

// Continuation lines of a multi-line message are indented by this much
const CONTINUATION_INDENT = ' '.repeat(6)

// The parts of b-ber-lib's State the summary reads. Structural, because
// b-ber-lib depends on this package and cannot be imported here
interface NavigationEntry {
  title?: string
  name?: string
  nodes?: NavigationEntry[]
}

interface SummaryState {
  config: unknown
  metadata: { json(): unknown }
  toc: NavigationEntry[]
}

// What `done` emits on `done`
export interface DoneEvent extends RunTime {
  state: unknown
}

interface LoggerEvents {
  begin: [{ task: unknown }]
  end: [{ task: unknown; taskTime: TaskTime }]
  done: [DoneEvent]
}

// What `log.error` throws when it is given something other than an Error, so
// that the build stops there. Errors it is given are thrown as they are
class ReportedError extends Error {
  name = 'ReportedError'
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' &&
  v !== null &&
  Object.getPrototypeOf(v) === Object.prototype

// Formats a byte count for the `{N}` placeholder: 1024 → "1.02 Kb"
export function floatFormat(value: unknown): string {
  const n = Number(value)
  const units = ['B', 'Kb', 'Mb', 'Gb']
  // The number of digits picks the unit: up to 3 is bytes, 4–6 Kb, and so on
  const digits = String(Math.trunc(Math.abs(n))).length
  const unit = Math.min(Math.floor((digits - 1) / 3), units.length - 1)
  return `${(n / 10 ** (unit * 3)).toFixed(2)} ${units[unit]}`
}

// The b-ber build logger. Writes levelled lines to stdout, records warnings
// and errors, and times the build's tasks through the `begin`/`end`/`done`
// events.
//
// `log.error` reports an error and then throws, so that whatever called it
// stops. It never exits the process: that is the caller's decision, and
// b-ber-cli makes it (see its lib/exit.ts).
//
// The logging methods are arrow-function properties rather than prototype
// methods because callers pass them around unbound, as in
// `promise.catch(log.error)`.
class Logger extends EventEmitter<LoggerEvents> {
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

  // The errors `report` has printed, so that one which is reported again on
  // its way up a promise chain (`.catch(log.error)` at every level) prints
  // once
  private reported = new WeakSet<object>()

  constructor(options: LoggerOptions = {}) {
    super()
    this.configure(options)

    this.on('begin', this.onBegin)
    this.on('end', this.onEnd)
    this.on('done', this.onDone)
  }

  // Applies the options that are set; leaves the others as they are
  configure(options: LoggerOptions): void {
    if (options.logLevel !== undefined) this.logLevel = options.logLevel
    if (options.boringOutput !== undefined) {
      this.boringOutput = options.boringOutput
    }
    if (options.summary !== undefined) this.summary = options.summary
  }

  reset(): void {
    this.errors = []
    this.warnings = []
  }

  // Logging

  // Reports an error and throws it, so that the code after the call does not
  // run. In a promise chain, `.catch(log.error)` reports the rejection and
  // passes it on: the chain stays rejected.
  //
  // The log level decides only whether the error is printed. It is recorded,
  // and thrown, at every level.
  //
  // Typed with an explicit annotation, which is what lets TypeScript treat a
  // call as the end of the code path
  readonly error: (...args: unknown[]) => never = (...args) => {
    throw this.report(...args)
  }

  // Reports an error without throwing, and returns what `log.error` would
  // throw. For code that has already stopped and only needs the error shown,
  // such as the CLI's last-resort handler.
  //
  // One argument that is an array reports each element as its own error.
  // Anything else is one error: an Error, or a message with util.format
  // placeholders and its values. An error that has been reported already is
  // returned as it is, and not printed again
  report = (...args: unknown[]): Error => {
    const [first] = args
    if (args.length === 1 && this.isReported(first)) return first

    const groups: unknown[][] =
      args.length === 1 && Array.isArray(first)
        ? first.map((entry) => [entry])
        : [args]
    const errors = groups.map((group) => this.reportOne(group))

    if (errors.length === 1) return errors[0]

    const error = new ReportedError(errors.map((e) => e.message).join('\n'))
    this.reported.add(error)
    return error
  }

  // Whether `value` is an error that `report` (or `log.error`) has already
  // printed
  isReported = (value: unknown): value is Error =>
    typeof value === 'object' && value !== null && this.reported.has(value)

  warn = (...args: unknown[]): void => {
    if (this.logLevel < LEVEL.warn) return

    const [first] = args
    const message = this.composeMessage(
      first instanceof Error ? [first.message] : args
    )
    const { stack } = new Error()
    const formatted = this.line('warn', message)

    this.taskWarnings += 1
    this.warnings.push({ stack, message, formatted })

    this.write(formatted)
    if (this.logLevel >= LEVEL.verbose) this.writeStack(stack)
  }

  // A message that is shown unless the output is quiet
  notice = (...args: unknown[]): void => {
    if (this.logLevel < LEVEL.error) return
    this.write(this.line('info', this.composeMessage(args)))
  }

  // Detail, shown at `--verbose`
  info = (...args: unknown[]): void => {
    if (this.logLevel < LEVEL.verbose) return

    this.write(this.line('info', this.composeMessage(args)))
    if (this.logLevel >= LEVEL.debug) this.writeStack(new Error().stack)
  }

  // Both no-ops. Callers pass the message they would log
  debug = (..._args: unknown[]): void => {}
  trace = (..._args: unknown[]): void => {}

  // Prints any value in full, for debugging
  inspect = (value: unknown): void => {
    this.write(
      util.inspect(value, {
        showHidden: true,
        depth: null,
        colors: this.colorEnabled,
      })
    )
  }

  // Prints the line the CLI ends a failed command with
  printFailure(code: number): void {
    if (this.logLevel < LEVEL.error) return
    this.write(this.line('error', `exited with code ${code}`))
  }

  printVersion(version: string): void {
    this.notice('version %s', version)
  }

  // Announces the tasks a build is about to run
  registerSequence(
    _state: unknown,
    _command: string,
    sequence: string[]
  ): void {
    this.notice(
      'Preparing to run %d %s',
      sequence.length,
      sequence.length > 1 ? 'tasks' : 'task'
    )
  }

  // Build progress
  //
  // b-ber-tasks' `serialize` calls these, through `notify`, around each task
  // and once the build has run. Each emits an event, which the listeners
  // below print. The events are the extension point: anything that wants to
  // follow a build's progress can listen for them

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

  private onEnd = ({
    task,
    taskTime,
  }: {
    task: unknown
    taskTime: TaskTime
  }): void => {
    if (this.logLevel < LEVEL.info) return
    this.write(
      this.line('info', `${this.decorate(task)} done (${taskTime.totalMs})`)
    )
  }

  private onDone = (data: DoneEvent): void => {
    if (this.logLevel < LEVEL.error) return
    this.write(this.line('info', this.decorate('Build succeeded', 'green')))
    if (this.summary) this.printSummary(data)
  }

  // Output

  // The only place the logger writes. stdout, one line per call
  private write(text: string): void {
    process.stdout.write(`${text}\n`)
  }

  // The frames of a stack trace, under the line that has printed its message
  private writeStack(stack: string | undefined): void {
    const frames = stack?.indexOf('\n    at ') ?? -1
    if (stack && frames > -1) this.write(stack.slice(frames + 1))
  }

  private reportOne(args: unknown[]): Error {
    const [first] = args
    const error =
      first instanceof Error && args.length === 1
        ? first
        : new ReportedError(this.composeMessage(args, false))

    const message = this.composeMessage(
      first instanceof Error ? [first.message] : args
    )
    const formatted = this.line('error', message)

    this.taskErrors += 1
    this.errors.push({ stack: error.stack, message, formatted })
    this.reported.add(error)

    if (this.logLevel >= LEVEL.error) {
      this.write(formatted)
      if (this.logLevel >= LEVEL.verbose) this.writeStack(error.stack)
    }

    return error
  }

  // `[timestamp] b-ber LABEL message`, the timestamp from LEVEL.info up
  private line(label: Label, message: string): string {
    const [text, ...styles] = LABELS[label]
    let prefix = ''

    if (this.logLevel >= LEVEL.info) {
      prefix += `${this.decorate(`[${new Date().toISOString()}]`, 'gray')} `
    }

    prefix += `${this.decorate('b-ber', 'whiteBright', 'bgBlack')} `
    prefix += this.decorate(text, ...styles)

    return `${prefix} ${message}`
  }

  // Whether styles produce colour: not with `--no-color`, and not when chalk
  // finds that stdout cannot show it (a pipe, a CI log)
  private get colorEnabled(): boolean {
    return !this.boringOutput && chalk.level > 0
  }

  private decorate(value: unknown, ...styles: Style[]): string {
    let text = util.format(value)
    if (!this.colorEnabled) return text

    for (let i = styles.length - 1; i >= 0; i--) {
      text = chalk[styles[i]](text)
    }
    return text
  }

  // util.format, then the two placeholders b-ber's messages use: `{N}` is a
  // byte count, `[text]` is highlighted. Without colour the brackets stay, so
  // that the highlighted text is still set apart from the message around it
  private composeMessage(args: unknown[], color = this.colorEnabled): string {
    return util
      .format(...args)
      .split('\n')
      .map((a) => a.trim())
      .join(`\n${CONTINUATION_INDENT}`)
      .replace(/\{(\d+)\}/g, (_, d: string) =>
        color ? this.decorate(floatFormat(d), 'blueBright') : floatFormat(d)
      )
      .replace(/\[([^\]]+)\]/g, (match, s: string) =>
        color ? this.decorate(s, 'blueBright') : match
      )
  }

  // The summary `--summary` prints after a successful build

  private printSummary(data: DoneEvent): void {
    const state = data.state as SummaryState
    const heading = (text: string) => {
      this.write('')
      this.summaryLine(this.decorate(text, 'blueBright'))
    }

    heading('Stats')
    this.summaryLine(`Build Start: ${data.formattedStartDate}`)
    this.summaryLine(`Build End: ${data.formattedEndDate}`)
    this.summaryLine(`Elapsed: ${data.sequenceEnd}`)

    heading('Configuration')
    this.printConfig(state.config)

    heading('Metadata')
    for (const v of Object.values(
      state.metadata.json() as Record<string, unknown>
    )) {
      if (isPlainObject(v)) this.summaryLine(`${v.term}: ${v.value}`)
    }

    heading('Navigation')
    this.printNavigation(state.toc)
  }

  private summaryLine(text: string, depth = 0): void {
    this.write(this.line('info', `${'  '.repeat(depth)}${text}`))
  }

  private printConfig(config: unknown, depth = 0): void {
    for (const [k, v] of Object.entries(config as Record<string, unknown>)) {
      if (typeof v === 'string') this.summaryLine(`${k}: ${v}`, depth)
      if (isPlainObject(v)) {
        this.summaryLine(k, depth)
        this.printConfig(v, depth + 1)
      }
    }
  }

  private printNavigation(entries: NavigationEntry[], depth = 0): void {
    for (const item of entries) {
      this.summaryLine(`${item.title || '[no title]'}: ${item.name}`, depth)
      if (item.nodes?.length) this.printNavigation(item.nodes, depth + 1)
    }
  }
}

export default Logger
