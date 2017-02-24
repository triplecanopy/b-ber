
import { site } from '../tasks'

const command = 'site [options]'
const describe = 'Download bber-reader'
const builder = yargs =>
  yargs
    .options({
      'p': {
        alias: 'path',
        default: './_site',
        describe: 'Define the site path',
        type: 'string'
      }
    })
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 site')
const handler = argv => site()

export default {
  command,
  describe,
  builder,
  handler
}
