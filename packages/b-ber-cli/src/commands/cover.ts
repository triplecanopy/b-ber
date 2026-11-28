import { cover } from '@canopycanopycanopy/b-ber-tasks'
import type { Argv } from 'yargs'
import { noExtraArguments } from '../lib/arguments'
import { inBuildContext } from '../lib/context'
import { exitOnFailure, fail } from '../lib/exit'

const command = 'cover'
const describe = 'Generate a project cover'
const builder = (yargs: Argv) =>
  yargs
    .check(noExtraArguments)
    .fail((msg, err) => fail(msg, err, yargs))
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 cover\n\n${describe}`)

// In the epub build's context, the build State defaulted to
const handler = exitOnFailure(() => inBuildContext('epub', (ctx) => cover(ctx)))

export default {
  command,
  describe,
  builder,
  handler,
}
