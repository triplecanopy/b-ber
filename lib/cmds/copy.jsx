
import { copy } from '../tasks'

const command = ['copy', 'c']
const describe = 'Copy assets to the output dir'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 copy')
const handler = () => copy()

export default {
  command,
  describe,
  builder,
  handler
}
