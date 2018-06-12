import {theme} from '@canopycanopycanopy/b-ber-lib/theme'
import {fail} from '../helpers'

const command = 'theme <list>'
const describe = 'Manage a project\'s theme'
const builder = yargs =>
    yargs
        .command(
            'list',
            'List the installed themes',
            () => {},
            () => theme({list: true})
        )
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 theme\n\n${describe}`)
        .fail((msg, err) => fail(msg, err, yargs))

const handler = () => {}

export default {
    command,
    describe,
    builder,
    handler,
}
