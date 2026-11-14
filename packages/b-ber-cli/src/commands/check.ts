import { fail } from '@canopycanopycanopy/b-ber-lib/utils'
import { validate } from '@canopycanopycanopy/b-ber-tasks'
import type { Arguments, Argv } from 'yargs'

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

const handler = (argv: Arguments<{ project?: string }>) => {
  const project = argv.project || process.cwd()
  validate({ project })
}

export default {
  command,
  describe,
  builder,
  handler,
}
