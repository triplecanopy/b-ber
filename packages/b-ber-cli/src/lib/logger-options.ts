import type log from '@canopycanopycanopy/b-ber-logger'

type LoggerOptions = Parameters<typeof log.configure>[0]

// Log levels the shorthand flags stand for (b-ber-logger documents each one)
const QUIET = 0
const WARN = 2
const VERBOSE = 4
const DEBUG = 5

// The value of `--name=value` or `--name value`
const flagValue = (args: readonly string[], name: string) => {
  const index = args.findIndex((a) => a === name || a.startsWith(`${name}=`))
  if (index < 0) return undefined
  const arg = args[index]
  return arg === name ? args[index + 1] : arg.slice(name.length + 1)
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
  const options: LoggerOptions = {}

  const level = flagValue(args, '--log-level')
  if (level !== undefined && /^\d+$/.test(level)) {
    options.logLevel = Number(level)
  }

  if (args.includes('--quiet')) options.logLevel = QUIET
  if (args.includes('--verbose')) options.logLevel = VERBOSE
  if (args.includes('--debug')) options.logLevel = DEBUG

  if (args.includes('--no-color')) options.boringOutput = true
  if (args.includes('--summary')) options.summary = true

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

// The keys those flags add to yargs' argv (`--no-color` parses as
// `color: false`, `--log-level` as both spellings). Commands that turn argv
// into config options skip them: they are not project configuration
export const loggerArgvKeys = new Set([
  'quiet',
  'verbose',
  'debug',
  'summary',
  'color',
  'log-level',
  'logLevel',
])
