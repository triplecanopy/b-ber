import state from '@canopycanopycanopy/b-ber-lib/State'
import yargs from 'yargs'
import * as commands from './commands'
import { exitWithFailure } from './lib/exit'

const LINE_LENGTH = 70

// The top-level yargs fail handler. A usage error there (no command at all)
// shows b-ber's own usage text, and is not a failure. An error is: yargs
// passes one when a builder throws
export const showCustomHelp = (_msg: string, err: Error | null): void => {
  if (err) {
    exitWithFailure(err)
    return
  }
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

export default function bber() {
  return yargs
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
    .wrap(LINE_LENGTH).argv
}
