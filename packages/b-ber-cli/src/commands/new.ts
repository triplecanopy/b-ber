import state from '@canopycanopycanopy/b-ber-lib/State'
import { init as Initializer } from '@canopycanopycanopy/b-ber-tasks'
import { fail } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'
import {
  blacklistedConfigOptions,
  withConfigOptions,
  parseConfigFile,
} from '../lib/config-options'

const command = 'new <name>'
const describe = 'Create a new project'
const builder = (yargs: any) =>
  withConfigOptions(
    yargs.positional('name', {
      describe: 'New project name',
      type: 'string',
    })
  )
    .fail((msg: any, err: any) => fail(msg, err, yargs))
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 new "My Project"\n\n${describe}`)

const handler = async (argv: any) => {
  const { _, $0, name, config, ...configOptions } = argv

  let projectConfig: Record<string, any> = {}

  if (config) projectConfig = await parseConfigFile(config)

  projectConfig = { ...projectConfig, ...configOptions }

  for (const [key] of Object.entries(projectConfig)) {
    if (!state.has(`config.${key}`)) {
      log.warn('Invalid configuration option [%s]', key)
      delete projectConfig[key]
      continue
    }

    if (blacklistedConfigOptions.has(key)) {
      log.warn('Disallowed configuration option [%s]', key)
      delete projectConfig[key]
      continue
    }
  }

  const initializer = new Initializer({ name, config: projectConfig })
  initializer.start()
}

export default {
  command,
  describe,
  builder,
  handler,
}
