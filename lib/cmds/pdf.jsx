
import { pdf } from '../tasks'

const command = 'pdf'
const describe = 'Generate a PDF'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 pdf')
const handler = pdf

export default {
  command,
  describe,
  builder,
  handler
}
