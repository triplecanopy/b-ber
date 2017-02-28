
import { clean } from '../tasks'

const command = 'clean'
const describe = 'Remove the output dir'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 clean')
    .fail((msg/* , err */) => {
      console.log(msg) // eslint-disable-line no-console
    })
    .config({
      bber: {
        // default directories to remove
        defaults: ['epub', 'mobi', 'pdf', 'sample', 'web']
      }
    })
const handler = clean

export default {
  command,
  describe,
  builder,
  handler
}
