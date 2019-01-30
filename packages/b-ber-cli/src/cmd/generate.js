import { generate } from '@canopycanopycanopy/b-ber-tasks'
import { fail, ensure } from '@canopycanopycanopy/b-ber-lib/utils'

const command = 'generate <title> [type]'

const describe = 'Create a new chapter. Accepts arguments for metadata'

const builder = yargs =>
    yargs
        .positional('title', {
            describe: 'Page title',
            type: 'string',
        })
        .positional('type', {
            describe: 'Page type',
            choices: ['frontmatter', 'bodymatter', 'backmatter'],
            type: 'string',
        })
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 generate\n\n${describe}`)
        .fail((msg, err) => fail(msg, err, yargs))

const handler = () => ({ title, type }) =>
    ensure().then(() => generate({ title, type }))

export default {
    command,
    describe,
    builder,
    handler: handler(),
}
