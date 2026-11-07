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

  it.each([
    ['an unknown command', 'frobnicate'],
    ['the unregistered xml command', 'xml'],
  ])('does nothing for %s', (_label, command) => {
    // Defect: yargs is not in strict mode, so an unknown command matches
    // nothing, satisfies demandCommand (there is a word in `_`), runs no
    // handler and prints nothing. The process ends with status 0.
    const { tasks } = quietly([command])

    expect(tasks.xml).not.toHaveBeenCalled()
    expect(console.log).not.toHaveBeenCalled()
    expect(exit).not.toHaveBeenCalled()
  })

  it('runs bber build xml, which the build command string leaves out', async () => {
    const { tasks } = quietly(['build', 'xml'])
    await flushPromises()

    expect(tasks.serialize).toHaveBeenCalledWith(sequences.xml)
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
    // TASK-046: the whole path, from the command line to the exit.
    let logger
    runCli(['build', 'epub'], ({ tasks, log }) => {
      logger = spyOnLogger(log)
      tasks.serialize.mockImplementation(() =>
        Promise.reject(new Error('render failed')).catch(log.error)
      )
    })
    await flushPromises()

    expect(logger.error).toHaveBeenCalled()
    expect(exit).toHaveBeenCalledWith(1)
  })
})
