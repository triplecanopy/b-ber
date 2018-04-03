import {theme} from '@canopycanopycanopy/b-ber-lib/theme'
import log from '@canopycanopycanopy/b-ber-logger'
import {fail} from '../helpers'

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

const handler = _ => theme().catch(err => log.error(err))

export default {
    command,
    describe,
    builder,
    handler,
}
