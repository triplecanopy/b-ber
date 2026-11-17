import type { Arguments } from 'yargs'

// yargs `.check` functions for the words on a command line that nothing
// takes. yargs 13 ignores such a word: `bber frobnicate` ran nothing and
// exited 0, `bber opf extra` ran opf, and `bber build ebup` built every
// format. `.strict()` would report them, but it also rejects every flag not
// declared to yargs, which includes the logger's (logger-options.ts) and the
// config overrides, and yargs 13 has no strict mode for words alone.
//
// A check that returns a string fails with it, through the instance's `fail`
// handler, as a usage error.
type Check = (argv: Arguments) => true | string

// The top level: the first word names a registered command. No word at all is
// demandCommand's to report.
export const knownCommand =
  (names: string[]): Check =>
  (argv) => {
    const [name] = argv._
    return (
      name === undefined ||
      names.includes(String(name)) ||
      `Unknown command: ${name}`
    )
  }

// A command: by the time checks run, yargs has moved the words its
// positionals took out of `argv._`, which leaves the command's name and
// anything else
export const noExtraArguments: Check = (argv) => {
  const extra = argv._.slice(1)
  if (extra.length === 0) return true
  return `Unknown argument${extra.length > 1 ? 's' : ''}: ${extra.join(', ')}`
}

// `bber build`: every word after the command's name is a format. Several are
// allowed (`bber build epub web`), and build one after another.
export const knownFormats =
  (formats: string[]): Check =>
  (argv) => {
    const unknown = argv._.slice(1).filter(
      (word) => !formats.includes(String(word))
    )
    if (unknown.length === 0) return true
    return `Unknown format${unknown.length > 1 ? 's' : ''}: ${unknown.join(', ')}`
  }
