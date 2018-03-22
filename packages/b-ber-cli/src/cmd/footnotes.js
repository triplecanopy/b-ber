import {footnotes} from '@canopycanopycanopy/b-ber-tasks'
import {fail} from '../helpers'

const command = ['footnotes', 'f']
const describe = 'Creates a footnotes page'
const builder = yargs =>
    yargs
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 footnotes\n\n${describe}`)
        .fail((msg, err) => fail(msg, err, yargs))

const handler = footnotes

export default {
    command,
    describe,
    builder,
    handler,
}
