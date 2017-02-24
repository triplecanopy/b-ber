
import { editor } from '../tasks'

const command = ['editor', 'e']
const describe = 'Start web-based editor'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 editor')
const handler = argv => editor()

export default {
  command,
  describe,
  builder,
  handler
}
