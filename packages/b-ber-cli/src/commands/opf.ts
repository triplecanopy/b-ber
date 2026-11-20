import { opf } from '@canopycanopycanopy/b-ber-tasks'
import type { Argv } from 'yargs'
import { noExtraArguments } from '../lib/arguments'
import { exitOnFailure, fail } from '../lib/exit'

const command = 'opf'
const describe = 'Generate the opf'
const builder = (yargs: Argv) =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 opf\n\n${describe}`)
    .check(noExtraArguments)
    .fail((msg, err) => fail(msg, err, yargs))

const handler = exitOnFailure(() => opf())

export default {
  command,
  describe,
  builder,
  handler,
}
