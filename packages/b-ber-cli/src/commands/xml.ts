import { xml } from '@canopycanopycanopy/b-ber-tasks'
import type { Argv } from 'yargs'
import { inBuildContext } from '../lib/context'
import { exitOnFailure } from '../lib/exit'

const command = 'xml'
const describe = 'Export a project as an XML document'

const builder = (yargs: Argv) =>
  yargs.help('h').alias('h', 'help').usage(`\nUsage: $0 xml\n\n${describe}`)

// The xml build's pages as they are on disk, from the navigation alone
const handler = exitOnFailure(() =>
  inBuildContext('xml', (ctx) =>
    xml(ctx, { spine: ctx.settings.spine, loi: ctx.settings.loi })
  )
)

export default {
  command,
  describe,
  builder,
  handler,
}
