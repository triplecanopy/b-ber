
import { publish } from 'bber-output'

const command = ['publish [options...]', 'p']
const describe = 'Move books to the _site dir'
const builder = yargs =>
  yargs
    .options({
      i: {
        alias: 'input',
        default: './project',
        describe: 'Define the input path',
        type: 'string',
      },
      o: {
        alias: 'output',
        default: './_site',
        describe: 'Define the output path',
        type: 'string',
      },
    })
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 publish\n\n${describe}`)
const handler = publish

export default {
  command,
  describe,
  builder,
  handler,
}
