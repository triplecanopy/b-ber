import type log from '@canopycanopycanopy/b-ber-logger'

type LoggerOptions = Parameters<typeof log.configure>[0]

// Log levels the shorthand flags stand for (b-ber-logger documents each one)
const QUIET = 0
const WARN = 2
const VERBOSE = 4
const DEBUG = 5

// The logger's flags that take no value
const SWITCHES = new Set([
  '--quiet',
  '--verbose',
  '--debug',
  '--summary',
  '--no-color',
])

const LOG_LEVEL = '--log-level'
const isLevel = (word: string | undefined): word is string =>
  word !== undefined && /^\d+$/.test(word)

// Splits a command line into the logger's flags and everything else. The
// logger's flags are its alone: yargs is given only the rest. Declared to
// yargs or not, they would otherwise be parsed twice, and undeclared, yargs
// reads `--quiet epub` as `quiet: 'epub'` and the word is lost.
//
// `--log-level` takes the next word only when it is a level, so in
// `--log-level epub` the format is still a format. Nothing after `--` is a
// flag.
export function splitLoggerFlags(args: readonly string[]): {
  flags: string[]
  rest: string[]
} {
  const flags: string[] = []
  const rest: string[] = []

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]

    if (arg === '--') {
      rest.push(...args.slice(i))
      break
    }

    if (SWITCHES.has(arg) || arg.startsWith(`${LOG_LEVEL}=`)) {
      flags.push(arg)
    } else if (arg === LOG_LEVEL) {
      flags.push(arg)
      if (isLevel(args[i + 1])) {
        flags.push(args[i + 1])
        i += 1
      }
    } else {
      rest.push(arg)
    }
  }

  return { flags, rest }
}

// The command line without the logger's flags: what yargs parses
export const withoutLoggerFlags = (args: readonly string[]): string[] =>
  splitLoggerFlags(args).rest

// The value of `--log-level=value` or `--log-level value`
const logLevel = (flags: readonly string[]) => {
  const index = flags.findIndex(
    (a) => a === LOG_LEVEL || a.startsWith(`${LOG_LEVEL}=`)
  )
  if (index < 0) return undefined
  const flag = flags[index]
  return flag === LOG_LEVEL
    ? flags[index + 1]
    : flag.slice(LOG_LEVEL.length + 1)
}

// The logger's options, from the command line. They are read here, before
// yargs parses the command, because the logger has to be configured before
// anything is imported that logs: b-ber-lib's State reads the project when it
// is first loaded.
//
// `--quiet`, `--verbose` and `--debug` set the level and win over
// `--log-level`, in that order of precedence, lowest first.
//
// The reporter follows from the level and from where the output goes. Up to
// the default level, a terminal gets the redrawing progress line and anything
// else (a pipe, a CI log) the same output without it. Above it, and at
// `--quiet`, a line per message, as the logger has always printed
export function loggerOptions(
  args: readonly string[],
  stdout: Pick<NodeJS.WriteStream, 'isTTY'> = process.stdout
): LoggerOptions {
  const { flags } = splitLoggerFlags(args)
  const options: LoggerOptions = {}

  const level = logLevel(flags)
  if (isLevel(level)) options.logLevel = Number(level)

  if (flags.includes('--quiet')) options.logLevel = QUIET
  if (flags.includes('--verbose')) options.logLevel = VERBOSE
  if (flags.includes('--debug')) options.logLevel = DEBUG

  if (flags.includes('--no-color')) options.boringOutput = true
  if (flags.includes('--summary')) options.summary = true

  options.reporter = reporterFor(options.logLevel ?? WARN, stdout)

  return options
}

function reporterFor(
  level: number,
  stdout: Pick<NodeJS.WriteStream, 'isTTY'>
): LoggerOptions['reporter'] {
  if (level === QUIET || level > WARN) return 'lines'
  // A terminal that cannot move the cursor
  const dumb = process.env.TERM === 'dumb'
  return stdout.isTTY && !dumb ? 'progress' : 'plain'
}
