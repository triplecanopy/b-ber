import { ensure, fail } from '@canopycanopycanopy/b-ber-lib/utils'
import { generate } from '@canopycanopycanopy/b-ber-tasks'
import type { Arguments, Argv } from 'yargs'

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
    .fail((msg, err) => fail(msg, err, yargs))

// `<title>` in the command string is required, so yargs never calls the
// handler without it
const handler = (argv: Arguments<{ title?: string; type?: string }>) =>
  ensure()
    .then(() => generate({ title: argv.title as string, type: argv.type }))
    .catch(console.error)

export default {
  command,
  describe,
  builder,
  handler,
}
