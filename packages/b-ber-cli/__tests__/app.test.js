import sequences from '@canopycanopycanopy/b-ber-shapes-sequences/sequences'
import {
  flushPromises,
  mockProcessExit,
  runCli,
  spyOnLogger,
} from './helpers/cli'

// `bber <command>` end to end in-process: the real yargs wiring in
// src/app.ts and the real command modules, with the tasks mocked.

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  serialize: jest.fn(() => Promise.resolve()),
  validate: jest.fn(),
  xml: jest.fn(),
  opf: jest.fn(),
  init: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/State', () =>
  require('./helpers/cli').createMockState()
)

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  ensure: jest.fn(() => Promise.resolve()),
  fail: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/Theme', () => ({}))

jest.mock('@canopycanopycanopy/b-ber-templates/Project', () => ({
  javascripts: () => [],
  stylesheets: () => [],
}))

const USAGE = 'Usage: bber <command> [options]'

let exit

beforeEach(() => {
  jest.clearAllMocks()
  exit = mockProcessExit()
  jest.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(() => jest.restoreAllMocks())

const quietly = (args) => runCli(args, ({ log }) => spyOnLogger(log))

describe('bber', () => {
  it('prints the usage text when no command is given, without exiting', () => {
    // demandCommand fails into app.ts's showCustomHelp, which does not set
    // an exit status: `bber` alone ends with status 0.
    const { state } = quietly([])

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining(USAGE))
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining(`bber version ${state.version}`)
    )
    expect(exit).not.toHaveBeenCalled()
  })

  it('treats `bber --help` as `bber`: the usage text, without exiting', () => {
    // Help is off at the top level, so --help is just a flag, and there is
    // no command
    quietly(['--help'])

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining(USAGE))
    expect(exit).not.toHaveBeenCalled()
  })

  it.each([
    ['an unknown command', 'frobnicate'],
    ['the unregistered xml command', 'xml'],
  ])('rejects %s: the usage text, the error naming it, exit 1', (_l, word) => {
    // Issue 741: yargs 13 matched nothing, ran nothing, printed nothing and
    // exited 0
    let logger
    const { tasks, stoppedByExit } = runCli([word], ({ log }) => {
      logger = spyOnLogger(log)
    })

    expect(console.log).toHaveBeenCalledWith(expect.stringContaining(USAGE))
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ message: `Unknown command: ${word}` })
    )
    expect(stoppedByExit).toBe(true)
    expect(exit).toHaveBeenCalledWith(1)
    expect(tasks.xml).not.toHaveBeenCalled()
  })

  it('runs bber build xml', async () => {
    const { tasks } = quietly(['build', 'xml'])
    await flushPromises()

    expect(tasks.serialize).toHaveBeenCalledWith(sequences.xml)
  })

  it('runs several formats given together, one after another', async () => {
    const { tasks, stoppedByExit } = quietly(['build', 'epub', 'web'])
    await flushPromises()

    expect(stoppedByExit).toBe(false)
    expect(tasks.serialize.mock.calls).toEqual([
      [sequences.epub],
      [sequences.web],
    ])
  })

  it.each([
    ['in place of a format', ['build', 'ebup'], 'Unknown format: ebup'],
    // The positional the command string used to have took this word, and
    // the handler then built every format
    ['after a format', ['build', 'epub', 'ebup'], 'Unknown format: ebup'],
    [
      'after a command that takes none',
      ['opf', 'extra'],
      'Unknown argument: extra',
    ],
    [
      'after the positionals a command takes',
      ['new', 'My', 'Project'],
      'Unknown argument: Project',
    ],
  ])('rejects a word %s, running nothing', async (_label, args, message) => {
    let logger
    const { tasks, stoppedByExit } = runCli(args, ({ log }) => {
      logger = spyOnLogger(log)
    })
    await flushPromises()

    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ message })
    )
    expect(stoppedByExit).toBe(true)
    for (const task of Object.values(tasks)) {
      expect(task).not.toHaveBeenCalled()
    }
  })

  it('hands build the argv yargs produces, with nothing the config loop rejects', async () => {
    // Pins the argv shape: yargs adds `_` and `$0` (destructured away by the
    // handler) and nothing else for a plain flag, so no spurious "Invalid
    // configuration option" warnings.
    let logger
    const { state } = runCli(
      ['build', 'epub', '--env', 'production'],
      ({ log }) => {
        logger = spyOnLogger(log)
      }
    )
    await flushPromises()

    expect(logger.warn).not.toHaveBeenCalled()
    expect(state.update).toHaveBeenCalledWith('config.env', 'production')
  })

  it('passes a build failure that reaches log.error through as exit status 1', async () => {
    // The whole path, from the command line to the exit: log.error throws,
    // and the command's handler turns that into the exit.
    let logger
    runCli(['build', 'epub'], ({ tasks, log }) => {
      logger = spyOnLogger(log)
      tasks.serialize.mockImplementation(() =>
        Promise.reject(new Error('render failed')).catch((err) => {
          throw log.error(err)
        })
      )
    })
    await flushPromises()

    expect(logger.error).toHaveBeenCalled()
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('exits 1 when yargs hands its top-level fail handler an error', () => {
    // yargs does that when a builder throws. A usage error with no error,
    // such as no command at all, prints the usage text and exits 0 (above)
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const { showCustomHelp } = require('../src/app')

    showCustomHelp(null, new Error('builder threw'))

    expect(console.log).not.toHaveBeenCalled()
    expect(exit).toHaveBeenCalledWith(1)
  })
})
