import { ensure, fail } from '@canopycanopycanopy/b-ber-lib/utils'
import { generate } from '@canopycanopycanopy/b-ber-tasks'

const command = 'generate <title> [type]'
const describe = 'Create a new chapter. Accepts arguments for metadata'

const builder = (yargs: any) =>
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
    .fail((msg: any, err: any) => fail(msg, err, yargs))

const handler = (argv: any) =>
  ensure()
    .then(() => generate({ title: argv.title, type: argv.type }))
    .catch(console.error)

export default {
  command,
  describe,
  builder,
  handler,
}
