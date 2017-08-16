
import { xml } from 'bber-output'

const command = ['xml', 'x']
const describe = 'Export a project as an XML document'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 xml\n\n${describe}`)
const handler = xml

export default {
  command,
  describe,
  builder,
  handler,
}
