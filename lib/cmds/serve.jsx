
import { serve } from '../tasks'

const command = 'serve'
const describe = 'Preview a book in the bber-reader'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 serve')
const handler = () => serve()

export default {
  command,
  describe,
  builder,
  handler
}
