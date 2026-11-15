import Theme from '@canopycanopycanopy/b-ber-lib/Theme'
import { ensure } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'
import theme from '../../src/commands/theme'
import {
  flushPromises,
  mockProcessExit,
  runCli,
  spyOnLogger,
} from '../helpers/cli'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({}))

jest.mock('@canopycanopycanopy/b-ber-lib/State', () =>
  require('../helpers/cli').createMockState()
)

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  ensure: jest.fn(),
  fail: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/Theme', () => ({
  set: jest.fn(),
  list: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-templates/Project', () => ({}))

let exit
let logger

beforeEach(() => {
  jest.clearAllMocks()
  exit = mockProcessExit()
  logger = spyOnLogger(log)
  jest.spyOn(console, 'error').mockImplementation(() => undefined)
  ensure.mockResolvedValue()
  Theme.set.mockResolvedValue()
  Theme.list.mockResolvedValue()
})

afterEach(() => jest.restoreAllMocks())

describe('theme handler', () => {
  it('bber theme set <name> ensures the project, then sets the theme', async () => {
    await theme.handler({ command: 'set', options: 'b-ber-theme-sans' })

    expect(ensure).toHaveBeenCalledWith()
    expect(Theme.set).toHaveBeenCalledWith('b-ber-theme-sans')
    expect(Theme.list).not.toHaveBeenCalled()
  })

  it('bber theme list lists the themes', async () => {
    await theme.handler({ command: 'list' })

    expect(Theme.list).toHaveBeenCalledWith(undefined)
    expect(Theme.set).not.toHaveBeenCalled()
  })

  it('waits for the theme operation before resolving', async () => {
    let finishSet
    Theme.set.mockReturnValueOnce(
      new Promise((resolve) => (finishSet = resolve))
    )
    let resolved = false

    const pending = theme.handler({ command: 'set', options: 'x' }).then(() => {
      resolved = true
    })
    await flushPromises()
    expect(resolved).toBe(false)

    finishSet()
    await pending
    expect(resolved).toBe(true)
  })

  describe('through yargs', () => {
    it('passes the command and options positionals', async () => {
      const { Theme: isolatedTheme, utils } = runCli(
        ['theme', 'set', 'b-ber-theme-sans'],
        ({ utils, log }) => {
          utils.ensure.mockResolvedValue()
          spyOnLogger(log)
        }
      )
      await flushPromises()

      expect(utils.ensure).toHaveBeenCalled()
      expect(isolatedTheme.set).toHaveBeenCalledWith('b-ber-theme-sans')
    })

    it('rejects a command that is not set or list', () => {
      const {
        Theme: isolatedTheme,
        utils,
        stoppedByFail,
      } = runCli(['theme', 'delete'], ({ log }) => spyOnLogger(log))

      expect(stoppedByFail).toBe(true)
      expect(isolatedTheme.set).not.toHaveBeenCalled()
      expect(utils.fail).toHaveBeenCalledWith(
        expect.stringMatching(/Invalid values/),
        undefined,
        expect.anything()
      )
    })
  })

  describe('when the operation fails', () => {
    it('exits 1 when the failure reaches log.error', async () => {
      Theme.set.mockImplementationOnce(async () => {
        log.error('Theme [missing] does not exist')
      })

      await theme.handler({ command: 'set', options: 'missing' })

      expect(logger.error).toHaveBeenCalled()
      expect(exit).toHaveBeenCalledWith(1)
    })

    it('exits 1 on any other rejection, printing it through the logger', async () => {
      // Issue 740: `.catch(console.error)` used to end the process with
      // status 0.
      const error = new Error('set rejected')
      Theme.set.mockRejectedValueOnce(error)

      await theme.handler({ command: 'set', options: 'x' })

      expect(log.errors.map((e) => e.message)).toEqual(['set rejected'])
      expect(console.error).not.toHaveBeenCalled()
      expect(exit).toHaveBeenCalledWith(1)
    })
  })
})
