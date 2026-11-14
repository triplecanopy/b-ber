import { fail } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'
import { serve } from '@canopycanopycanopy/b-ber-tasks'
import type { Arguments, Argv } from 'yargs'

const command = 'serve [build] [opts]'
const describe = 'Preview a project in the browser using the `reader` build.'

const handler = (argv: Arguments<{ build?: string; external?: boolean }>) => {
  const { external, build } = argv

  log.notice(`Serving [b-ber-${build}]`)

  return serve({ build, external })
}

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
    .fail((msg, err) => fail(msg, err, yargs))

export default {
  command,
  describe,
  builder,
  handler,
}
