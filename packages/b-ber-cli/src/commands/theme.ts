import Theme from '@canopycanopycanopy/b-ber-lib/Theme'
import { ensure, fail } from '@canopycanopycanopy/b-ber-lib/utils'
import type { Arguments, Argv } from 'yargs'

const _command = 'theme <command> [options]'
const describe = "Manage a project's theme"

const handler = (args: Arguments<{ command?: string; options?: string }>) =>
  ensure()
    .then(async () => {
      // `choices` in the builder restricts `command` to these two.
      const command = args.command as 'set' | 'list'
      const options = args.options as string
      // Awaited rather than returned: yargs wants the handler to resolve to
      // void, and discards the value either way.
      await Theme[command](options)
    })
    .catch(console.error)

const builder = (yargs: Argv) =>
  yargs
    .positional('command', {
      describe: 'Theme command to execute',
      choices: ['set', 'list'],
      type: 'string',
    })
    .positional('options', {
      describe: 'Name of the theme to activate',
      type: 'string',
    })
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 theme\n\n${describe}`)
    .fail((msg, err) => fail(msg, err, yargs))

export default {
  command: _command,
  describe,
  builder,
  handler,
}
