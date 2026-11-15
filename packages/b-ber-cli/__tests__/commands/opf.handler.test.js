import log from '@canopycanopycanopy/b-ber-logger'
import { opf as opfTask } from '@canopycanopycanopy/b-ber-tasks'
import opf from '../../src/commands/opf'
import {
  flushPromises,
  mockProcessExit,
  runCli,
  spyOnLogger,
} from '../helpers/cli'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  opf: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/State', () =>
  require('../helpers/cli').createMockState()
)

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  ensure: jest.fn(() => Promise.resolve()),
  fail: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/Theme', () => ({}))

jest.mock('@canopycanopycanopy/b-ber-templates/Project', () => ({}))

let exit
let logger

beforeEach(() => {
  jest.clearAllMocks()
  exit = mockProcessExit()
  logger = spyOnLogger(log)
  jest.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(() => jest.restoreAllMocks())

describe('opf handler', () => {
  it('runs the opf task, without passing it argv', async () => {
    await opf.handler({ _: ['opf'] })
    expect(opfTask).toHaveBeenCalledWith()
  })

  it('is reached through yargs', () => {
    const { tasks } = runCli(['opf'], ({ tasks, log }) => {
      tasks.opf.mockResolvedValue()
      spyOnLogger(log)
    })
    expect(tasks.opf).toHaveBeenCalledTimes(1)
  })

  describe('when the task fails', () => {
    it('exits 1 when the failure reaches log.error', async () => {
      opfTask.mockImplementationOnce(async () => {
        log.error('opf failed')
      })

      await opf.handler({})

      expect(logger.error).toHaveBeenCalled()
      expect(exit).toHaveBeenCalledWith(1)
    })

    it('exits 1 on any other rejection, printing it', async () => {
      // Issue 740: the rejection used to fall through to app.ts's
      // `.fail(showCustomHelp)`, which printed the usage text instead of the
      // error, and the process ended with status 0.
      const error = new Error('opf failed')
      const { log: isolatedLog } = runCli(['opf'], ({ tasks, log }) => {
        tasks.opf.mockRejectedValue(error)
        spyOnLogger(log)
      })
      await flushPromises()

      expect(isolatedLog.errors.map((e) => e.message)).toEqual(['opf failed'])
      expect(console.log).not.toHaveBeenCalled()
      expect(exit).toHaveBeenCalledWith(1)
    })
  })
})
