import fs from 'fs-extra'
import path from 'path'
import Yaml from 'bber-lib/yaml'
import log from 'b-ber-logger'
import { serve as Server } from 'bber-lib'

const command = ['serve [options...]', 's']
const describe = 'Preview a project in the bber-reader'
const builder = yargs =>
    yargs
        .options({
            d: {
                alias: 'dir',
                describe: 'The directory to serve from',
                default: './_site',
                type: 'string',
            },
            p: {
                alias: 'port',
                describe: 'Server port',
                default: 3000,
                type: 'string',
            },
        })
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 serve\n\n${describe}`)

const handler = (argv) => {
    // get args
    const { dir, port } = argv
    const options = { dir, port }
    const _options = argv.options
    const shorthand = _options.length ? _options[0] : null

    if (shorthand) {
        // resolve shorthand flags -> [epub, mobi, web, sample]
        const cwd = process.cwd()
        const configPath = path.join(cwd, 'config.yml')


        try {
            if (!fs.existsSync(configPath)) {
                throw new Error('Shorthand server flags require a config.yml')
            }

            const config = Yaml.load(configPath)
            options.dir = `${config.dist}-${shorthand}/OPS/text`
        } catch (err) {
            return log.warn(err.message)
        }
    }

    const server = new Server(options)
    return server.serve()
}

export default {
    command,
    describe,
    builder,
    handler,
}
