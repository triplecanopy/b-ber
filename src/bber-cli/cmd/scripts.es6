
import { scripts } from 'bber-modifiers'

const command = ['scripts', 'j']
const describe = 'Compile and uglify JavaScript'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 scripts\n\n${describe}`)
const handler = scripts

export default {
  command,
  describe,
  builder,
  handler,
}
