/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
/* eslint-disable no-continue */
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
const builder = yargs =>
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

const handler = async argv => {
  // Extract CLI options and get the config file option in case there is one
  const { _, $0, name, config, ...configOptions } = argv

  // Set up the config object that's going to be passed into the `init` function
  let projectConfig = {}

  // Check if a config files has been specified
  if (config) projectConfig = await parseConfigFile(config)

  // Override the values specified in the config file with values
  // that have been explicitly provided on the CLI. Allows using the
  // config file as a template that can be overridden, e.g.,
  // bber new foo --config my-generic-conf.yaml --base_path /foo
  projectConfig = { ...projectConfig, ...configOptions }

  // Remove blacklisted and unsupported config options
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
