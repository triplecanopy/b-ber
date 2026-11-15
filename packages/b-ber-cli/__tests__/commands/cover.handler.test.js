import log from '@canopycanopycanopy/b-ber-logger'
import { cover as coverTask } from '@canopycanopycanopy/b-ber-tasks'
import cover from '../../src/commands/cover'
import {
  flushPromises,
  mockProcessExit,
  runCli,
  spyOnLogger,
} from '../helpers/cli'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  cover: jest.fn(),
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

describe('cover handler', () => {
  it('runs the cover task without arguments and returns its promise', async () => {
    coverTask.mockResolvedValueOnce('cover.jpg')
    await expect(cover.handler({ _: ['cover'] })).resolves.toBe('cover.jpg')
    expect(coverTask).toHaveBeenCalledWith()
  })

  it('is reached through yargs', () => {
    const { tasks } = runCli(['cover'], ({ tasks, log }) => {
      tasks.cover.mockResolvedValue()
      spyOnLogger(log)
    })
    expect(tasks.cover).toHaveBeenCalledTimes(1)
  })

  describe('when the task fails', () => {
    it('exits 1 when the failure reaches log.error', async () => {
      // The cover task catches its own errors with log.error, which throws.
      coverTask.mockImplementationOnce(async () => {
        log.error('Cover image listed in metadata.yml cannot be found')
      })

      await cover.handler()

      expect(logger.error).toHaveBeenCalled()
      expect(exit).toHaveBeenCalledWith(1)
    })

    it('exits 1 on any other rejection, printing it, without reaching yargs', async () => {
      // Issue 740: the rejection used to reach the command's fail handler,
      // b-ber-lib's `fail`, which showed help and exited 0.
      const error = new Error('cover failed')
      const { utils, log: isolatedLog } = runCli(
        ['cover'],
        ({ tasks, log }) => {
          tasks.cover.mockRejectedValue(error)
          spyOnLogger(log)
        }
      )
      await flushPromises()

      expect(isolatedLog.errors.map((e) => e.message)).toEqual(['cover failed'])
      expect(exit).toHaveBeenCalledWith(1)
      expect(utils.fail).not.toHaveBeenCalled()
    })
  })
})
