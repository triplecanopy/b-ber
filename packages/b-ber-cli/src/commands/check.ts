import { validate } from '@canopycanopycanopy/b-ber-tasks'
import { fail } from '@canopycanopycanopy/b-ber-lib/utils'

const command = 'check [project]'

const describe = 'Validate b-ber project Markdown'

const builder = (yargs: any) =>
  yargs
    .positional('project', {
      describe: 'Path to the b-ber project',
      type: 'string',
    })
    .help('h')
    .alias('h', 'help')
    .fail((msg: any, err: any) => fail(msg, err, yargs))
    .usage(`\nUsage: $0 check\n\n${describe}`)

const handler = (argv: any) => {
  const project = argv.project || process.cwd()
  validate({ project })
}

export default {
  command,
  describe,
  builder,
  handler,
}
