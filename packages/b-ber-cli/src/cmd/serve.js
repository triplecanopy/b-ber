import { serve } from '@canopycanopycanopy/b-ber-tasks'
import log from '@canopycanopycanopy/b-ber-logger'
import { fail } from '@canopycanopycanopy/b-ber-lib/utils'

const command = ['serve', 's']
const describe = 'Preview a project in the browser using the `web` build.'

const handler = yargs => {
    const build = (String(yargs.argv._[1]) || 'web').toLowerCase()
    if (build !== 'web' && build !== 'reader') return fail('', '', yargs)

    log.notice(`Serving [b-ber-${build}]`)
    return serve({ build })
}

const builder = yargs =>
    yargs
        .command('', 'Serve the Web build', () => {}, () => handler(yargs))
        .command('web', 'Serve the Web build', () => {}, () => handler(yargs))
        .command('reader', 'Serve the Reader build', () => {}, () => handler(yargs))
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 serve\n\n${describe}`)

export default {
    command,
    describe,
    builder,
    handler,
}
