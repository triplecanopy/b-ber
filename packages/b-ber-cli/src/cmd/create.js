import path from 'path'
import fs from 'fs-extra'
import {init as Initializer} from '@canopycanopycanopy/b-ber-tasks'
import log from '@canopycanopycanopy/b-ber-logger'
import {fail} from '../helpers'

const command = 'create'
const describe = 'Create a new project'
const builder = yargs =>
    yargs
        .options({
            n: {
                alias: 'name',
                describe: 'New project directory name',
                type: 'string',
                demandOption: true,
            },
        })
        .fail((msg, err) => fail(msg, err, yargs))
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 create --name "My Project"\n\n${describe}`)


const handler = argv => {
    const {name} = argv
    const args = [...argv._]
    args.shift() // remove `create` argument
    args.push(name) // add `name` arg consumed by yargs

    const dest = path.join(process.cwd(), name)

    if (args.length > 1) {
        log.error(`Too many arguments [${args.length}]. Make sure the project name is properly quoted`)
    }

    try {
        if (fs.existsSync(dest)) {
            const files = fs.readdirSync(dest)
            if (files.length) {
                throw new Error(`Directory [${name}] exists and is not empty, aborting`)
            }
        } else {
            log.info(`Creating directory ${name}`)
            fs.mkdirSync(dest)
        }
    } catch (e) {
        log.error(e)
        process.exit(0)
    }

    const initializer = new Initializer({cwd: dest})

    initializer.start(name)
        .catch(err => {
            log.error(err)
            process.exit(1)
        })
}

export default {
    command,
    describe,
    builder,
    handler,
}
