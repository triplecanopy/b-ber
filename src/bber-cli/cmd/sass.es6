
import { sass } from 'bber-modifiers'

const command = ['sass', 's']
const describe = 'Compile the SCSS'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 sass')
const handler = sass

export default {
  command,
  describe,
  builder,
  handler
}
