import { fail } from '@canopycanopycanopy/b-ber-lib/utils'
import { cover } from '@canopycanopycanopy/b-ber-tasks'
import type { Argv } from 'yargs'

const command = 'cover'
const describe = 'Generate a project cover'
const builder = (yargs: Argv) =>
  yargs
    .fail((msg, err) => fail(msg, err, yargs))
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 cover\n\n${describe}`)

const handler = () => cover()

export default {
  command,
  describe,
  builder,
  handler,
}
