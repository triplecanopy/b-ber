// TODO: remove this? need to remove from `build.jsx` as well
import { mobiCSS } from 'bber-output'

const command = 'mobiCSS'
const describe = 'Remove incompatible CSS for Mobi files'
const builder = yargs =>
    yargs
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 mobiCSS\n\n${describe}`)
const handler = mobiCSS

export default {
    command,
    describe,
    builder,
    handler,
}
