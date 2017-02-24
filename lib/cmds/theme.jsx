
import { theme } from '../tasks'

const command = ['theme [options]', 't']
const describe = 'Select a theme for the book'
const builder = yargs =>
  yargs
    .options({
      l: {
        alias: 'list',
        describe: 'List the installed themes',
        type: 'boolean'
      },
      s: {
        alias: 'set',
        describe: 'Set the current theme',
        type: 'string'
      }
    })
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 theme')
const handler = () => theme()

export default {
  command,
  describe,
  builder,
  handler
}
