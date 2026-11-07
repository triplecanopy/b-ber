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
  it('is the opf task itself', () => {
    expect(opf.handler).toBe(opfTask)
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
      // TASK-046
      opfTask.mockImplementationOnce(async () => {
        log.error('opf failed')
      })

      await opf.handler({})

      expect(logger.error).toHaveBeenCalled()
      expect(exit).toHaveBeenCalledWith(1)
    })

    it('hands a rejection to yargs, which prints the usage text and does not exit', async () => {
      // Defect: opf's builder registers no fail handler, so the rejection
      // falls through to app.ts's `.fail(showCustomHelp)`, which prints the
      // usage text. The error itself is never printed, and the process ends
      // with status 0.
      const error = new Error('opf failed')
      const { utils } = runCli(['opf'], ({ tasks, log }) => {
        tasks.opf.mockRejectedValue(error)
        spyOnLogger(log)
      })
      await flushPromises()

      expect(utils.fail).not.toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Usage: bber <command> [options]')
      )
      expect(exit).not.toHaveBeenCalled()
    })
  })
})
