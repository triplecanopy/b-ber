import { cover } from '@canopycanopycanopy/b-ber-tasks'
import type { Argv } from 'yargs'
import { exitOnFailure, fail } from '../lib/exit'

const command = 'cover'
const describe = 'Generate a project cover'
const builder = (yargs: Argv) =>
  yargs
    .fail((msg, err) => fail(msg, err, yargs))
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 cover\n\n${describe}`)

const handler = exitOnFailure(() => cover())

export default {
  command,
  describe,
  builder,
  handler,
}
