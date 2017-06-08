
import path from 'path'
import fs from 'fs-extra'
import { clean } from 'bber-output'
import { log } from 'bber-plugins'
import { fail } from 'bber-cli/helpers'

const command = ['clean [options...]', 'd']
const describe = 'Remove the output dir'
const builder = yargs =>
  yargs
    .options({
      d: {
        alias: 'dir',
        describe: 'Directory to remove',
        default: '',
        type: 'string',
      },
    })
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 clean')
    .fail((msg, err) => fail(msg, err, yargs))
    .config({
      bber: {
        // default directories to remove
        defaults: ['epub', 'mobi', 'pdf', 'sample', 'web'],
      },
    })

// const handler = clean
const handler = (argv) => {
  const d = argv.d

  if (!d) {
    throw new Error('Specify a directory to remove')
  }

  let dirPath
  try {
    dirPath = path.resolve(process.cwd(), d)
  } catch (err) {
    throw err
  }

  if (!fs.existsSync(dirPath)) {
    throw new Error(`The directory [${dirPath}] does not exist`)
  }

  return clean(dirPath).then(log.info(`Removed [${dirPath}]`))
}

export default {
  command,
  describe,
  builder,
  handler,
}
