import state from '@canopycanopycanopy/b-ber-lib/State'
import yargs from 'yargs'
import * as commands from './commands'
import { knownCommand } from './lib/arguments'
import { fail } from './lib/exit'

const LINE_LENGTH = 70

// The first word of each command string, which is the word that selects it
const COMMAND_NAMES = Object.values(commands).map(
  ({ command }) => command.split(' ')[0]
)

const printUsage = (): void => {
  console.log(`
    Usage: bber <command> [options]

    bber new        Start a new project
    bber generate   Create a new chapter. Accepts arguments for metadata.
    bber serve      Preview the publication's contents in a browser
    bber build      Create an ePub, mobi, PDF, or all file formats
    bber check      Validate a project's markdown

    For more information on a command, enter bber <command> --help

    bber version ${state.version}
`)
}

// The top-level yargs fail handler. Without an error, yargs is reporting that
// there is no command at all: `bber` alone, or `bber --help`, which reaches
// here the same way because help is off at this level. The usage text is
// what was asked for, so that is not a failure, and the exit status stays 0.
//
// With one, it is a failure. yargs passes an Error when a builder throws, and
// knownCommand's message for a word that names no command, which shows the
// usage text first.
export const showCustomHelp = (
  msg: string,
  err: Error | string | null | undefined
): void => {
  if (!err) {
    printUsage()
    return
  }
  fail(msg, err, { showHelp: printUsage })
}

export default function bber() {
  return (
    yargs
      .command(commands.build)
      .command(commands.generate)
      .command(commands.opf)
      .command(commands.theme)
      .command(commands.serve)
      .command(commands.new)
      .command(commands.cover)
      .command(commands.deploy)
      .command(commands.check)

      .help(false)
      .fail(showCustomHelp)

      .demandCommand()
      // Not global, so it runs only when no command matched. Each command
      // checks its own words.
      .check(knownCommand(COMMAND_NAMES), false)
      .wrap(LINE_LENGTH).argv
  )
}
