import {serve} from '@canopycanopycanopy/b-ber-tasks'

const command = ['serve', 's']
const describe = 'Preview a project in the browser using the `web` build.'
const builder = yargs =>
    yargs
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 serve\n\n${describe}`)
const handler = serve

export default {
    command,
    describe,
    builder,
    handler,
}
