
import { pdf } from 'bber-output'

const command = 'pdf'
const describe = 'Generate a PDF'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 pdf\n\n${describe}`)
const handler = pdf

export default {
  command,
  describe,
  builder,
  handler,
}
