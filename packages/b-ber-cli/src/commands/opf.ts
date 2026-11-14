import { opf } from '@canopycanopycanopy/b-ber-tasks'
import type { Argv } from 'yargs'

const command = 'opf'
const describe = 'Generate the opf'
const builder = (yargs: Argv) =>
  yargs.help('h').alias('h', 'help').usage(`\nUsage: $0 opf\n\n${describe}`)

const handler = opf

export default {
  command,
  describe,
  builder,
  handler,
}
