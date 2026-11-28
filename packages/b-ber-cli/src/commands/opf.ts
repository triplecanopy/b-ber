import { opf } from '@canopycanopycanopy/b-ber-tasks'
import type { Argv } from 'yargs'
import { noExtraArguments } from '../lib/arguments'
import { inBuildContext } from '../lib/context'
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

// The epub build's OPF, from the navigation alone: nothing has been rendered
// to add figure pages or guide entries
const handler = exitOnFailure(() =>
  inBuildContext('epub', (ctx) => {
    const { spine, toc, guide, loi, remoteAssets } = ctx.settings
    return opf(ctx, { spine, toc, guide, loi, remoteAssets })
  })
)

export default {
  command,
  describe,
  builder,
  handler,
}
