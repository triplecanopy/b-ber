import { deploy } from '@canopycanopycanopy/b-ber-tasks'

const command = ['deploy']
const describe = 'Deploy the current project'
const builder = yargs =>
    yargs
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 deploy\n\n${describe}`)

const handler = deploy

export default {
    command,
    describe,
    builder,
    handler,
}
