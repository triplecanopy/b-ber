import { ensure } from '@canopycanopycanopy/b-ber-lib/utils'
import { generate } from '@canopycanopycanopy/b-ber-tasks'
import type { Arguments, Argv } from 'yargs'
import { noExtraArguments } from '../lib/arguments'
import { exitOnFailure, fail } from '../lib/exit'

const command = 'generate <title> [type]'
const describe = 'Create a new chapter. Accepts arguments for metadata'

const builder = (yargs: Argv) =>
  yargs
    .positional('title', {
      describe: 'Page title',
      type: 'string',
    })
    .positional('type', {
      describe: 'Page type',
      choices: ['frontmatter', 'bodymatter', 'backmatter'],
      type: 'string',
    })
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 generate\n\n${describe}`)
    .check(noExtraArguments)
    .fail((msg, err) => fail(msg, err, yargs))

// `<title>` in the command string is required, so yargs never calls the
// handler without it
const handler = exitOnFailure(
  async (argv: Arguments<{ title?: string; type?: string }>) => {
    await ensure()
    await generate({ title: argv.title as string, type: argv.type })
  }
)

export default {
  command,
  describe,
  builder,
  handler,
}
