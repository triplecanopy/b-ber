
import { mobiCSS } from '../tasks'

const command = 'mobiCSS'
const describe = 'Remove incompatible CSS for Mobi files'
const builder = yargs =>
  yargs
    .help('h')
    .alias('h', 'help')
    .usage('\nUsage: $0 mobiCSS')
const handler = mobiCSS

export default {
  command,
  describe,
  builder,
  handler
}
