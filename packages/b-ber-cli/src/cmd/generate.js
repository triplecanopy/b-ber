import {generate} from '@canopycanopycanopy/b-ber-tasks'
import log from '@canopycanopycanopy/b-ber-logger'
import {fail} from '../helpers'

const command = 'generate'
const describe = 'Create a new chapter. Accepts arguments for metadata'
const builder = yargs =>
    yargs
        .options({
            title: {
                describe: 'Define the chapters\'s title',
                default: '',
                type: 'string',
            },
            type: {
                describe: 'Define the chapters\'s type',
                default: '',
                type: 'string',
            },
        })

        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 generate\n\n${describe}`)
        .fail((msg, err) => fail(msg, err, yargs))

const handler = () =>
    generate().then(({title}) =>
        log.info(`Generated new page [${title}]`)
    ).catch(_ => console.log(_))

export default {
    command,
    describe,
    builder,
    handler,
}