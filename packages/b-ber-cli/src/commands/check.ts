import { validate } from '@canopycanopycanopy/b-ber-tasks'
import type { Arguments, Argv } from 'yargs'
import { noExtraArguments } from '../lib/arguments'
import { exitOnFailure, fail } from '../lib/exit'

const command = 'check [project]'

const describe = 'Validate b-ber project Markdown'

const builder = (yargs: Argv) =>
  yargs
    .positional('project', {
      describe: 'Path to the b-ber project',
      type: 'string',
    })
    .option('strict', {
      describe: 'Fail on warnings as well as errors, for CI',
      type: 'boolean',
      default: false,
    })
    .help('h')
    .alias('h', 'help')
    .check(noExtraArguments)
    .fail((msg, err) => fail(msg, err, yargs))
    .usage(`\nUsage: $0 check [project] [--strict]\n\n${describe}`)

// Exits 1 when a file has an error, or with `--strict` a warning
const handler = exitOnFailure(
  (argv: Arguments<{ project?: string; strict?: boolean }>) =>
    validate({
      project: argv.project || process.cwd(),
      strict: Boolean(argv.strict),
    })
)

export default {
  command,
  describe,
  builder,
  handler,
}
