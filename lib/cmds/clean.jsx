
import { clean } from '../tasks'

// TODO: Should accept args for which directories to remove if called directly

const command = 'clean'
const describe = 'Remove the output dir'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 clean')
    .config({
      bber: {
        defaults: ['epub', 'mobi', 'pdf', 'sample', 'web'] // default directories to remove
      }
    })
const handler = () => clean()

export default {
  command,
  describe,
  builder,
  handler
}
