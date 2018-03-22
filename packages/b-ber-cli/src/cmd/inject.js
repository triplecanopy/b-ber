import {inject} from '@canopycanopycanopy/b-ber-tasks'

const command = ['inject', 'n']
const describe = 'Inject scripts and styles into XHTML'
const builder = yargs =>
    yargs
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 inject\n\n${describe}`)
const handler = inject

export default {
    command,
    describe,
    builder,
    handler,
}
