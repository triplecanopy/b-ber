import path from 'node:path'
import {
  loadProject,
  mergeConfig,
  readConfig,
  runBuild,
} from '@canopycanopycanopy/b-ber-lib'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { ensure } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'
import createBuildSequence from '@canopycanopycanopy/b-ber-shapes-sequences/create-build-sequence'
import sequences from '@canopycanopycanopy/b-ber-shapes-sequences/sequences'
import { serialize } from '@canopycanopycanopy/b-ber-tasks'
import Project from '@canopycanopycanopy/b-ber-templates/Project'
import type { Arguments, Argv } from 'yargs'
import { knownFormats } from '../lib/arguments'
import {
  blacklistedConfigOptions,
  parseConfigFile,
  withConfigOptions,
} from '../lib/config-options'
import { exitOnFailure, fail } from '../lib/exit'

// Every format `bber build` knows, in the order `bber build` alone runs them
const FORMATS = Object.keys(sequences)

// No positional: one would take the first word that is not a format
// sub-command (`bber build ebup`) out of `argv._`, where knownFormats could
// not see it, and the handler would build every format. The formats are in
// the usage line instead, from the sequences, so that it cannot leave one out.
const command = 'build'
const describe = 'Build a project'

const noop = () => {}

// The options from the --config file and the command line that config.yml
// knows and the CLI allows, each one warned about or announced once
const configOverrides = (
  options: Record<string, unknown>,
  config: Record<string, unknown>
): Record<string, unknown> => {
  const overrides: Record<string, unknown> = {}

  for (const [key, val] of Object.entries(options)) {
    if (!Object.hasOwn(config, key)) {
      log.warn('Invalid configuration option [%s]', key)
      continue
    }

    if (blacklistedConfigOptions.has(key)) {
      log.warn('Disallowed configuration option [%s]', key)
      continue
    }

    log.notice('Applying configuration option [%s]:[%s]', key, val)
    overrides[key] = val
  }

  return overrides
}

const handler = exitOnFailure(async (argv: Arguments) => {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development'

  const { _: desiredSequences, $0, config, ...configOptions } = argv
  const sequence = createBuildSequence(desiredSequences)
  const subSequence = sequence.reduce(
    (a: string[], c) => a.concat(...sequences[c]),
    [] as string[]
  )

  let projectConfig: Record<string, unknown> = {}

  if (typeof config === 'string') projectConfig = await parseConfigFile(config)

  projectConfig = { ...projectConfig, ...configOptions }

  // The overrides apply before the project is read, so that a flag naming the
  // source or output directory, or the theme, takes effect (TASK-163). Each
  // target then resolves its own config: config.yml, its section, the
  // overrides
  const overrides = configOverrides(projectConfig, readConfig())
  const project = loadProject(process.cwd(), overrides)

  state.update('sequence', subSequence)
  log.registerSequence(
    sequence.map((name) => ({ name, tasks: sequences[name] }))
  )

  const { src } = mergeConfig(project.config, overrides)
  const projectPath = path.resolve(src as string)
  const files = [...Project.javascripts(projectPath), ...Project.stylesheets()]

  await ensure({ files, src: src as string })
  await runBuild(project, sequence, ({ target }) =>
    serialize(sequences[target.name])
  )
})

const builder = (yargs: Argv) =>
  withConfigOptions(yargs)
    .command('', 'Build all formats', noop, handler)
    .command('epub', 'Build an Epub', noop, handler)
    .command('mobi', 'Build a Mobi', noop, handler)
    .command('pdf', 'Build a PDF', noop, handler)
    .command('reader', 'Build for the b-ber-reader format', noop, handler)
    .command('sample', 'Build a sample Epub', noop, handler)
    .command('web', 'Build for web', noop, handler)
    .command('xml', 'Build for XML', noop, handler)
    // Global, the default, so that it also runs in the format sub-command
    // that matched, which leaves any later words in `argv._`
    .check(knownFormats(FORMATS))
    .help('h')
    .alias('h', 'help')
    .usage(`\nUsage: $0 build [${FORMATS.join('|')}]\n\n${describe}`)
    .fail((msg, err) => fail(msg, err, yargs))

export default {
  command,
  describe,
  builder,
  handler,
}
