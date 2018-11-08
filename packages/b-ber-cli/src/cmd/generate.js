import { generate } from '@canopycanopycanopy/b-ber-tasks'
import { fail } from '../helpers'

const command = 'generate'
const describe = 'Create a new chapter. Accepts arguments for metadata'
const builder = yargs =>
    yargs
        .options({
            title: {
                describe: 'Chapter title',
                demandOption: true,
                type: 'string',
            },
            type: {
                describe: 'Chapter type',
                default: 'bodymatter',
                type: 'string',
            },
        })

        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 generate\n\n${describe}`)
        .fail((msg, err) => fail(msg, err, yargs))

const handler = generate

export default {
    command,
    describe,
    builder,
    handler,
}
