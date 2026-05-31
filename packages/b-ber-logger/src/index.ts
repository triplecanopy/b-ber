import Timer from './Timer'
import { printWarnings, printErrors } from './printer'
import {
  indent,
  incrementIndent,
  decrementIndent,
  incrementCounter,
  decrementCounter,
} from './indenter'
import { bind } from './listeners'
import { notify } from './events'
import { warn } from './warn'
import { info } from './info'
import { error } from './error'
import { debug } from './debug'
import { trace } from './trace'
import { notice } from './notice'
import { inspect } from './inspect'
import { printSummary } from './summary'
import { configure } from './configure'
import { printVersion } from './print-version'
import { registerSequence } from './register'
import { wrap, decorate, floatFormat } from './format'
import { counter, getContext } from './context'
import { composeMessage } from './compose'
import { reset } from './reset'

interface LoggerSettings {
  quiet: boolean
  verbose: boolean
  debug: boolean
  summary: boolean
  'no-color': boolean
  'log-level': number
}

interface LogEntry {
  stack: string | undefined
  message: string
  formatted: string
}

class Logger extends Timer {
  static defaults = {
    logLevel: 2,
    boringOutput: false,
    summary: false,
    command: null as string | null,
    consoleWidth: 70,
    errors: [] as LogEntry[],
    warnings: [] as LogEntry[],
    taskWarnings: 0,
    taskErrors: 0,
    whitespace: ' ',
    increment: 0,
    indentLevel: 0,
    taskCounter: -1,
    context: null as string | null,
  }

  logLevel!: number
  boringOutput!: boolean
  command!: string | null
  consoleWidth!: number
  errors!: LogEntry[]
  warnings!: LogEntry[]
  taskWarnings!: number
  taskErrors!: number
  whitespace!: string
  increment!: number
  indentLevel!: number
  taskCounter!: number
  context!: string | null
  summary?: boolean
  task?: string
  settings!: LoggerSettings

  printWarnings!: (task?: string) => void
  printErrors!: (task?: string) => void
  indent!: () => string
  incrementIndent!: () => void
  decrementIndent!: () => void
  incrementCounter!: () => void
  decrementCounter!: () => void
  bind!: () => void
  notify!: (event: string, data: unknown) => void
  warn!: (...args: unknown[]) => void
  info!: (...args: unknown[]) => void
  error!: (args: unknown) => void
  debug!: () => void
  trace!: () => void
  notice!: (...args: unknown[]) => void
  inspect!: (args: unknown) => void
  printSummary!: (data: unknown) => void
  configure!: () => void
  printVersion!: (version: string) => void
  registerSequence!: (state: unknown, command: string, sequence: string[]) => void
  wrap!: (arr: string[], space: string) => string
  decorate!: (args: unknown, ...props: string[]) => string
  floatFormat!: (n: unknown) => string
  counter!: () => string
  getContext!: () => string
  composeMessage!: (args: unknown[]) => string
  reset!: () => void

  constructor() {
    super()

    this.logLevel = Logger.defaults.logLevel
    this.boringOutput = Logger.defaults.boringOutput
    this.command = Logger.defaults.command
    this.consoleWidth = Logger.defaults.consoleWidth
    this.errors = []
    this.warnings = []

    this.taskWarnings = Logger.defaults.taskWarnings
    this.taskErrors = Logger.defaults.taskErrors

    this.whitespace = Logger.defaults.whitespace
    this.increment = Logger.defaults.increment
    this.indentLevel = Logger.defaults.indentLevel
    this.taskCounter = Logger.defaults.taskCounter
    this.context = Logger.defaults.context

    this.settings = {
      quiet: false,
      verbose: false,
      debug: false,
      summary: Logger.defaults.summary,
      'no-color': Logger.defaults.boringOutput,
      'log-level': Logger.defaults.logLevel,
    }

    this.printWarnings = printWarnings.bind(this)
    this.printErrors = printErrors.bind(this)

    this.indent = indent.bind(this)
    this.incrementIndent = incrementIndent.bind(this)
    this.decrementIndent = decrementIndent.bind(this)
    this.incrementCounter = incrementCounter.bind(this)
    this.decrementCounter = decrementCounter.bind(this)

    this.bind = bind.bind(this)
    this.notify = notify.bind(this)

    this.warn = warn.bind(this)
    this.info = info.bind(this)
    this.error = error.bind(this)
    this.debug = debug.bind(this)
    this.trace = trace.bind(this)
    this.notice = notice.bind(this)
    this.inspect = inspect.bind(this)
    this.printSummary = printSummary.bind(this)

    this.configure = configure.bind(this)
    this.printVersion = printVersion.bind(this)
    this.registerSequence = registerSequence.bind(this)

    this.wrap = wrap.bind(this)
    this.decorate = decorate.bind(this)
    this.floatFormat = floatFormat.bind(this)

    this.counter = counter.bind(this)
    this.getContext = getContext.bind(this)

    this.composeMessage = composeMessage.bind(this)
    this.reset = reset.bind(this)

    const argv = process.argv.reduce<Record<string, string | number | boolean>>(
      (acc, curr) => {
        const [k, v] = curr.split('=')
        acc[k] = v === undefined ? true : !isNaN(Number(v)) ? Number(v) : v
        return acc
      },
      {}
    )

    Object.keys(this.settings).forEach(a => {
      const opt = `--${a}`
      if (Object.prototype.hasOwnProperty.call(argv, opt)) {
        ;(this.settings as Record<string, unknown>)[a] = argv[opt]
      }
    })

    this.configure()
    this.bind()
  }

  newLine(): void {
    process.stdout.write('\n')
  }
}

const log = new Logger()
export default log
