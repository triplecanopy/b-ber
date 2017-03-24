
import { generate } from 'bber-output'
import { log } from 'bber-plugins'

const command = ['generate [options...]', 'g']
const describe = 'Create a new chapter. Accepts arguments for metadata'
const builder = yargs =>
  yargs
    .options({
      s: {
        alias: 'section_title',
        describe: 'Define the chapters\'s title',
        default: '',
        type: 'string'
      },
      l: {
        alias: 'landmark_type',
        describe: 'Define the chapters\'s landmark type',
        default: '',
        type: 'string'
      },
      t: {
        alias: 'landmark_title',
        describe: 'Define the chapters\'s landmark title',
        default: '',
        type: 'string'
      }
    })

    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 generate')

const handler = () =>
  generate().then(({ title }) =>
    log.info(`Generated new page [${title}]`))

export default {
  command,
  describe,
  builder,
  handler
}
