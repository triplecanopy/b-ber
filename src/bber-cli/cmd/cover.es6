import { cover } from 'bber-output'
import { fail } from 'bber-cli/helpers'

const command = 'cover'
const describe = 'Generate a book cover'
const builder = yargs =>
  yargs
    .options({})
    .fail((msg, err) => fail(msg, err, yargs))
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 cover\n\n${describe}`)


const handler = () => cover.init()

export default {
  command,
  describe,
  builder,
  handler,
}
