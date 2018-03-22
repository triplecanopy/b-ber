import {render} from '@canopycanopycanopy/b-ber-tasks'

const command = ['render', 'r']
const describe = 'Transform Markdown to XHTML'
const builder = yargs =>
    yargs
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 render\n\n${describe}`)
const handler = render

export default {
    command,
    describe,
    builder,
    handler,
}
