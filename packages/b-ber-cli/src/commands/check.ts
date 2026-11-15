import { validate } from '@canopycanopycanopy/b-ber-tasks'
import type { Arguments, Argv } from 'yargs'
import { exitOnFailure, fail } from '../lib/exit'

const command = 'check [project]'

const describe = 'Validate b-ber project Markdown'

const builder = (yargs: Argv) =>
  yargs
    .positional('project', {
      describe: 'Path to the b-ber project',
      type: 'string',
    })
    .help('h')
    .alias('h', 'help')
    .fail((msg, err) => fail(msg, err, yargs))
    .usage(`\nUsage: $0 check\n\n${describe}`)

const handler = exitOnFailure((argv: Arguments<{ project?: string }>) =>
  validate({ project: argv.project || process.cwd() })
)

export default {
  command,
  describe,
  builder,
  handler,
}
