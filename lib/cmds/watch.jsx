
import { watch } from '../tasks'

const command = ['watch', 'w']
const describe = 'Preview a book in the browser'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 watch')
const handler = argv => watch()

export default {
  command,
  describe,
  builder,
  handler
}
