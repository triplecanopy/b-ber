
import { sass } from '../tasks'

const command = ['sass', 's']
const describe = 'Compile the SCSS'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 sass')
const handler = argv => sass()

export default {
  command,
  describe,
  builder,
  handler
}
