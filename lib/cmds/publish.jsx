
import { publish } from '../tasks'

const command = ['publish [options...]', 'p']
const describe = 'Move books to the _site dir'
const builder = yargs =>
  yargs
    .options({
      i: {
        alias: 'input',
        default: './book',
        describe: 'Define the input path',
        type: 'string'
      },
      o: {
        alias: 'output',
        default: './_site',
        describe: 'Define the output path',
        type: 'string'
      }
    })
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 publish')
const handler = () => publish()

export default {
  command,
  describe,
  builder,
  handler
}
