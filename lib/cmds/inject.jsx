
import { inject } from '../tasks'

const command = ['inject', 'n']
const describe = 'Inject scripts and styles into XHTML'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 inject')
const handler = argv => inject()

export default {
  command,
  describe,
  builder,
  handler
}
