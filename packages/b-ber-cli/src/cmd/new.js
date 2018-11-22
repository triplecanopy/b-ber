import path from 'path'
import fs from 'fs-extra'
import { init as Initializer } from '@canopycanopycanopy/b-ber-tasks'
import log from '@canopycanopycanopy/b-ber-logger'
import { fail } from '../helpers'

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
    const projectName = argv.project
    const args = [...argv._]

    args.shift() // remove `new` argument
    args.push(projectName) // add `projectName` arg consumed by yargs

    const projectPath = path.join(process.cwd(), projectName)

    if (args.length > 1) {
        log.error(
            `Too many arguments [${
                args.length
            }]. Make sure the project name is properly quoted`,
        )
    }

    try {
        if (fs.existsSync(projectPath)) {
            const files = fs.readdirSync(projectPath)
            if (files.length) {
                throw new Error(
                    `Directory [${projectName}] exists and is not empty, aborting`,
                )
            }
        } else {
            log.info(`Creating directory ${projectName}`)
            fs.mkdirSync(projectPath)
        }
    } catch (e) {
        log.error(e)
        process.exit(0)
    }

    const initializer = new Initializer({ projectName, projectPath })
    initializer.start()
}

export default {
    command,
    describe,
    builder,
    handler,
}
