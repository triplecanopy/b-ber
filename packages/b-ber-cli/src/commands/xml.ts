import { xml } from '@canopycanopycanopy/b-ber-tasks'
import type { Argv } from 'yargs'

const command = 'xml'
const describe = 'Export a project as an XML document'

const builder = (yargs: Argv) =>
  yargs.help('h').alias('h', 'help').usage(`\nUsage: $0 xml\n\n${describe}`)

const handler = xml

export default {
  command,
  describe,
  builder,
  handler,
}
