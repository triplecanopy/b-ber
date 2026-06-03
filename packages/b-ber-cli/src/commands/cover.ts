import { fail } from '@canopycanopycanopy/b-ber-lib/utils'
import { cover } from '@canopycanopycanopy/b-ber-tasks'

const command = 'cover'
const describe = 'Generate a project cover'
const builder = (yargs: any) =>
  yargs
    .fail((msg: any, err: any) => fail(msg, err, yargs))
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
