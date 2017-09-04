import { watch } from 'bber-output'

const command = ['watch', 'w']
const describe = 'Preview a project in the browser. Watches for changes in `src`, and serves files from the `dist` directory as defined in config.yml' // eslint-disable-line max-len
const builder = yargs =>
    yargs
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 watch\n\n${describe}`)
const handler = watch

export default {
  command,
  describe,
  builder,
  handler,
}
