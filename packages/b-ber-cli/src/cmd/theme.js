import Theme from '@canopycanopycanopy/b-ber-lib/Theme'
import { fail } from '../helpers'

const _command = 'theme <command> [options]'
const describe = "Manage a project's theme"

const handler = args => {
    const { command, options } = args
    return Theme[command](options)
}

const builder = yargs =>
    yargs
        .positional('command', {
            describe: 'Theme command to execute',
            choices: ['set', 'list', 'ls', 'install'],
            type: 'string',
        })
        .positional('options', {
            describe: 'Name of the theme to activate',
            type: 'string',
        })
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 theme\n\n${describe}`)
        .fail((msg, err) => fail(msg, err, yargs))

export default {
    command: _command,
    describe,
    builder,
    handler,
}
