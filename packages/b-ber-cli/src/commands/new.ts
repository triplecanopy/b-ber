import state from '@canopycanopycanopy/b-ber-lib/State'
import { fail } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'
import { init as Initializer } from '@canopycanopycanopy/b-ber-tasks'
import type { Arguments, Argv } from 'yargs'
import {
  blacklistedConfigOptions,
  parseConfigFile,
  withConfigOptions,
} from '../lib/config-options'

const command = 'new <name>'
const describe = 'Create a new project'
const builder = (yargs: Argv) =>
  withConfigOptions(
    yargs.positional('name', {
      describe: 'New project name',
      type: 'string',
    })
  )
    .fail((msg, err) => fail(msg, err, yargs))
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 new "My Project"\n\n${describe}`)

const handler = async (argv: Arguments<{ name?: string }>) => {
  const { _, $0, name, config, ...configOptions } = argv

  let projectConfig: Record<string, unknown> = {}

  if (typeof config === 'string') projectConfig = await parseConfigFile(config)

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

  // `<name>` in the command string is required, so yargs never calls the
  // handler without it
  const initializer = new Initializer({
    name: name as string,
    config: projectConfig,
  })
  initializer.start()
}

export default {
  command,
  describe,
  builder,
  handler,
}
