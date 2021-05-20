import yargs from 'yargs'
import state from '@canopycanopycanopy/b-ber-lib/State'
import * as commands from './commands'

const LINE_LENGTH = 70

export default function bber() {
  const showCustomHelp = () =>
    console.log(`
    Usage: bber <command> [options]

    bber new        Start a new project
    bber generate   Create a new chapter. Accepts arguments for metadata.
    bber serve      Preview the publication's contents in a browser
    bber build      Create an ePub, mobi, PDF, or all file formats
    bber check      Validate a project’s markdown

    For more information on a command, enter bber <command> --help

    bber version ${state.version}
`)

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
