import path from 'path'
import fs from 'fs-extra'
import {init as Initializer} from '@canopycanopycanopy/b-ber-tasks'
import log from '@canopycanopycanopy/b-ber-logger'
import {fail} from '../helpers'

const command = 'new <project>'
const describe = 'Create a new project'
const builder = yargs =>
    yargs
        .positional('project', {
            describe: 'New project name',
            type: 'string',
        })
        .fail((msg, err) => fail(msg, err, yargs))
        .help('h')
        .alias('h', 'help')
        .usage(`\nUsage: $0 new "My Project"\n\n${describe}`)

const handler = argv => {
    const {project} = argv
    const args = [...argv._]
    args.shift() // remove `new` argument
    args.push(project) // add `project` arg consumed by yargs

    const dest = path.join(process.cwd(), project)

    if (args.length > 1) {
        log.error(`Too many arguments [${args.length}]. Make sure the project project is properly quoted`)
    }

    try {
        if (fs.existsSync(dest)) {
            const files = fs.readdirSync(dest)
            if (files.length) {
                throw new Error(`Directory [${project}] exists and is not empty, aborting`)
            }
        } else {
            log.info(`Creating directory ${project}`)
            fs.mkdirSync(dest)
        }
    } catch (e) {
        log.error(e)
        process.exit(0)
    }

    const initializer = new Initializer({cwd: dest})

    initializer.start(project)
}

export default {
    command,
    describe,
    builder,
    handler,
}
