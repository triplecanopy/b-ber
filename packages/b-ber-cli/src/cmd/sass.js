import {sass} from '@canopycanopycanopy/b-ber-tasks'

const command = ['sass', 's']
const describe = 'Compile the SCSS'
const builder = yargs =>
    yargs
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 sass\n\n${describe}`)
const handler = sass

export default {
    command,
    describe,
    builder,
    handler,
}
