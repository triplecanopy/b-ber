
import { xml } from '../tasks'

const command = ['xml', 'x']
const describe = 'Export a book as an XML document'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 xml')
const handler = argv => xml()

export default {
  command,
  describe,
  builder,
  handler
}
