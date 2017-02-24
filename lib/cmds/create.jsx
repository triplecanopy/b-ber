
import { create } from '../tasks'

const command = 'create'
const describe = 'Create an Epub directory structure'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 create')
const handler = () => create()

export default {
  command,
  describe,
  builder,
  handler
}
