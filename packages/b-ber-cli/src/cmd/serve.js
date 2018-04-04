import {serve} from '@canopycanopycanopy/b-ber-tasks'

const command = ['serve', 's']
const describe = 'Preview a project in the browser using the `web` build.'
const builder = yargs =>
    yargs
        .options({
            w: {
                alias: 'web',
                describe: 'Serve the web build',
                default: true,
                type: 'boolean',
            },
            r: {
                alias: 'reader',
                describe: 'Serve the reader build',
                default: false,
                type: 'boolean',
            },
        })
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 serve\n\n${describe}`)

const handler = argv => {

    process.env.NODE_ENV = 'development'

    const build = argv.reader ? 'reader' : 'web'
    return serve({build})
}

export default {
    command,
    describe,
    builder,
    handler,
}
