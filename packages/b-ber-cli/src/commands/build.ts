import state from '@canopycanopycanopy/b-ber-lib/State'
import { ensure } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'
import createBuildSequence from '@canopycanopycanopy/b-ber-shapes-sequences/create-build-sequence'
import sequences from '@canopycanopycanopy/b-ber-shapes-sequences/sequences'
import { serialize } from '@canopycanopycanopy/b-ber-tasks'
import Project from '@canopycanopycanopy/b-ber-templates/Project'
import path from 'path'
import {
  blacklistedConfigOptions,
  parseConfigFile,
  withConfigOptions,
} from '../lib/config-options'

const command = 'build [|epub|mobi|pdf|reader|sample|web]'
const describe = 'Build a project'

const noop = () => {}

const handler = async (argv: any) => {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development'

  const { _: desiredSequences, $0, config, ...configOptions } = argv
  const sequence = createBuildSequence(desiredSequences)
  const subSequence = sequence.reduce(
    (a: any[], c: any) => a.concat(...sequences[c]),
    []
  )

  let projectConfig: Record<string, any> = {}

  if (config) projectConfig = await parseConfigFile(config)

  projectConfig = { ...projectConfig, ...configOptions }

  state.update('sequence', subSequence)
  log.registerSequence(state, command, subSequence)

  const run = (buildTasks: any[]) => {
    const build = buildTasks.shift()

    state.reset()
    state.update('build', build)

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

const builder = (yargs: any) =>
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
