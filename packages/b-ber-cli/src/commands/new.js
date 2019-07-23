import { init as Initializer } from '@canopycanopycanopy/b-ber-tasks'
import { fail } from '@canopycanopycanopy/b-ber-lib/utils'

const command = 'new <name>'
const describe = 'Create a new project'
const builder = yargs =>
    yargs
        .positional('name', {
            describe: 'New project name',
            type: 'string',
        })
        .fail((msg, err) => fail(msg, err, yargs))
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 new "My Project"\n\n${describe}`)

const handler = argv => {
    const { name } = argv
    const initializer = new Initializer({ name })
    initializer.start()
}

export default {
    command,
    describe,
    builder,
    handler,
}
