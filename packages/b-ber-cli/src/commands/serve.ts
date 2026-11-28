import { serve } from '@canopycanopycanopy/b-ber-tasks'
import type { Arguments, Argv } from 'yargs'
import { noExtraArguments } from '../lib/arguments'
import { exitOnFailure, fail } from '../lib/exit'

const command = 'serve [build] [opts]'
const describe = 'Preview a project in the browser using the `reader` build.'

const handler = exitOnFailure(
  (argv: Arguments<{ build?: string; external?: boolean }>) => {
    const { external, build } = argv

    // The task announces the build it serves: it knows the default
    return serve({ build, external })
  }
)

const builder = (yargs: Argv) =>
  yargs
    .positional('build', {
      describe: 'Build to preview',
      choices: ['reader', 'web'],
      type: 'string',
    })
    .option('external', {
      alias: 'e',
      describe: 'Serve from an externally accessible URL',
      type: 'boolean',
    })
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 serve\n\n${describe}`)
    .check(noExtraArguments)
    .fail((msg, err) => fail(msg, err, yargs))

export default {
  command,
  describe,
  builder,
  handler,
}
