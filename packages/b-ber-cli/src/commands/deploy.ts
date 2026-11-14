import { fail } from '@canopycanopycanopy/b-ber-lib/utils'
import { deploy } from '@canopycanopycanopy/b-ber-tasks'
import type { Argv } from 'yargs'

const command = 'deploy [builds...]'
const describe = 'Upload a b-ber project to Amazon S3'
const builder = (yargs: Argv) =>
  yargs
    .option('yes', {
      alias: 'y',
      describe: 'Skip all confirmation prompts',
      type: 'boolean',
    })
    .positional('builds', {
      describe: 'Builds to upload',
      choices: ['epub', 'mobi', 'reader', 'web', 'pdf', 'xml'],
      type: 'string',
      // `[builds...]` is variadic, which yargs already parses as an array;
      // this tells the types
      array: true,
    })
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 deploy\n\n${describe}`)
    .fail((msg, err) => fail(msg, err, yargs))

const handler = deploy

export default {
  command,
  describe,
  builder,
  handler,
}
