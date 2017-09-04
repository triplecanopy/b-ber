
import { theme } from 'bber-lib'
import { fail } from 'bber-cli/helpers'

const command = 'theme'
const describe = 'Select a theme for the project'
const builder = yargs =>
    yargs
        .options({
            l: {
                alias: 'list',
                describe: 'List the installed themes',
                type: 'boolean',
            },
            s: {
                alias: 'set',
                describe: 'Set the current theme',
                type: 'string',
            },
        })
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 theme\n\n${describe}`)
        .fail((msg, err) => fail(msg, err, yargs))

const handler = () => theme().catch(_ => _)

export default {
    command,
    describe,
    builder,
    handler,
}
