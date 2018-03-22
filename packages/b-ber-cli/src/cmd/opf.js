import {opf} from '@canopycanopycanopy/b-ber-tasks'

const command = ['opf', 'o']
const describe = 'Generate the opf'
const builder = yargs =>
    yargs
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 opf\n\n${describe}`)
const handler = () => opf()

export default {
    command,
    describe,
    builder,
    handler,
}
