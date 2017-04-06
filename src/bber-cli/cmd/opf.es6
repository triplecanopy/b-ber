
import { opf } from 'bber-output'

const command = ['opf', 'o']
const describe = 'Generate the opf'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 opf')
const handler = () => opf()

export default {
  command,
  describe,
  builder,
  handler
}
