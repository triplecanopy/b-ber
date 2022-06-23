/* eslint-disable no-continue */
/* eslint-disable no-unused-vars */
import path from 'path'
import { serialize } from '@canopycanopycanopy/b-ber-tasks'
import state from '@canopycanopycanopy/b-ber-lib/State'
import createBuildSequence from '@canopycanopycanopy/b-ber-shapes-sequences/create-build-sequence'
import sequences from '@canopycanopycanopy/b-ber-shapes-sequences/sequences'
import Project from '@canopycanopycanopy/b-ber-templates/Project'
import { ensure } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'
import {
  blacklistedConfigOptions,
  parseConfigFile,
  withConfigOptions,
} from '../lib/config-options'

// Leading pipe ensures that the `all` command can be run without arguments
const command = 'build [|epub|mobi|pdf|reader|sample|web]'
const describe = 'Build a project'

const noop = () => {}

const handler = async argv => {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development'

  const { _: desiredSequences, $0, config, ...configOptions } = argv
  const sequence = createBuildSequence(desiredSequences)
  const subSequence = sequence.reduce((a, c) => a.concat(...sequences[c]), [])

  // Set up the config object that's going to be passed into the `init` function
  let projectConfig = {}

  // Check if a config files has been specified
  if (config) projectConfig = await parseConfigFile(config)

  projectConfig = { ...projectConfig, ...configOptions }

  state.update('sequence', subSequence)
  log.registerSequence(state, command, subSequence)

  const run = buildTasks => {
    const build = buildTasks.shift()

    // Reset any previous changes to state and update the build type
    state.reset()
    state.update('build', build)

    // Apply the config options that may have been passed in via CLI flags
    for (const [key, val] of Object.entries(projectConfig)) {
      if (!state.has(`config.${key}`)) {
        log.warn('Invalid configuration option [%s]', key)
        continue
      }

      if (blacklistedConfigOptions.has(key)) {
        log.warn('Disallowed configuration option [%s]', key)
        continue
      }

      log.notice('Applying configuration option [%s]:[%s]', key, val)

      state.update(`config.${key}`, val)
    }

    return serialize(sequences[build]).then(() => {
      if (buildTasks.length) run(buildTasks)
    })
  }

  const projectPath = path.resolve(state.srcDir)
  const files = [
    ...Project.javascripts(projectPath),
    ...Project.stylesheets(projectPath),
  ]

  ensure({ files })
    .then(() => run(sequence))
    .catch(console.error)
}

const builder = yargs =>
  withConfigOptions(yargs)
    .command('', 'Build all formats', noop, handler)
    .command('epub', 'Build an Epub', noop, handler)
    .command('mobi', 'Build a Mobi', noop, handler)
    .command('pdf', 'Build a PDF', noop, handler)
    .command('reader', 'Build for the b-ber-reader format', noop, handler)
    .command('sample', 'Build a sample Epub', noop, handler)
    .command('web', 'Build for web', noop, handler)
    .command('xml', 'Build for XML', noop, handler)
    .help('h')
    .alias('h', 'help')

export default {
  command,
  describe,
  builder,
  handler,
}
