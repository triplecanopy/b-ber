
import { generate } from 'bber-output'
import { log } from 'bber-plugins'
import { fail } from 'bber-cli/helpers'

const command = 'generate'
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
    .fail((msg, err) => fail(msg, err, yargs))

const handler = () => //console.log(generate())
  generate().then(({ title }) =>
    log.info(`Generated new page [${title}]`)
  ).catch(_ => console.log(_))

export default {
  command,
  describe,
  builder,
  handler
}
