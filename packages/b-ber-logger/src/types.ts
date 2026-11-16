import type { EventEmitter } from 'node:events'
import type { RunTime, TaskTime } from './Timer'

// What each log level shows. Each level shows everything the ones below it do
//
//   0  quiet    nothing
//   1  error    errors and notices (e.g. "Build succeeded")
//   2  warn     warnings (the default)
//   3  info     a line for each finished task, and a timestamp on every line
//   4  verbose  info, and the stack trace of each warning and error
//   5  debug    the stack trace of each info line
export const LEVEL = {
  quiet: 0,
  error: 1,
  warn: 2,
  info: 3,
  verbose: 4,
  debug: 5,
} as const

// How the build's output is drawn (see the reporters)
//
//   lines     a line per message, and from level 3 a line per task
//   progress  one redrawing line while a build runs, then its result
//   plain     what progress prints, without redrawing: for a pipe or a CI log
export type ReporterName = 'lines' | 'progress' | 'plain'

export interface LoggerOptions {
  // 0–5, see LEVEL
  logLevel?: number
  // Plain text, no ANSI colour
  boringOutput?: boolean
  // Print the build's stats, configuration, metadata and navigation when it
  // succeeds
  summary?: boolean
  // How the output is drawn. b-ber-cli chooses it; anything else gets `lines`
  reporter?: ReporterName
}

// One recorded warning or error
export interface LogEntry {
  message: string
  stack: string | undefined
}

// Each call to a logging method, as the `message` event carries it
export interface LogMessage {
  kind: 'error' | 'warn' | 'notice' | 'info' | 'inspect'
  // What the caller passed, an Error replaced by its message. A reporter
  // formats them, so that it decides the colour. For `inspect`, the value
  args: unknown[]
  // A stack trace, where the level the logger is at shows one
  stack?: string
}

// One format a build runs, and its tasks in order
export interface BuildPlan {
  name: string
  tasks: string[]
}

// What `done` emits on `done`
export interface DoneEvent extends RunTime {
  state: unknown
}

export interface LoggerEvents {
  // Every message, whatever the log level: the reporter decides what to show
  message: [LogMessage]
  // The formats a `bber build` is about to run, in order
  sequence: [BuildPlan[]]
  begin: [{ task: unknown }]
  end: [{ task: unknown; taskTime: TaskTime }]
  // Once per format, when its tasks have all run
  done: [DoneEvent]
  // Each error `log.error` reports, once. Not `error`: an EventEmitter throws
  // an `error` event that nothing listens for
  failure: [Error]
  // The CLI is about to exit with this status, after a failure
  exit: [{ code: number }]
}

// What a reporter reads from the logger: its events and its current options
export interface ReporterSource extends EventEmitter<LoggerEvents> {
  readonly logLevel: number
  readonly boringOutput: boolean
  readonly summary: boolean
}

export interface Reporter {
  // Stops listening, and finishes any line it has drawn
  detach(): void
}
