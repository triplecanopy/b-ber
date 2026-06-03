import { fail } from '@canopycanopycanopy/b-ber-lib/utils'
import { deploy } from '@canopycanopycanopy/b-ber-tasks'

const command = 'deploy [builds...]'
const describe = 'Upload a b-ber project to Amazon S3'
const builder = (yargs: any) =>
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
    })
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 deploy\n\n${describe}`)
    .fail((msg: any, err: any) => fail(msg, err, yargs))

const handler: any = deploy

export default {
  command,
  describe,
  builder,
  handler,
}
