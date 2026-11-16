import { xml } from '@canopycanopycanopy/b-ber-tasks'
import type { Argv } from 'yargs'
import { exitOnFailure } from '../lib/exit'

const command = 'xml'
const describe = 'Export a project as an XML document'

const builder = (yargs: Argv) =>
  yargs.help('h').alias('h', 'help').usage(`\nUsage: $0 xml\n\n${describe}`)

const handler = exitOnFailure(() => xml())

export default {
  command,
  describe,
  builder,
  handler,
}
