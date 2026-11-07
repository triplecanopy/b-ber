import log from '@canopycanopycanopy/b-ber-logger'
import { serve as serveTask } from '@canopycanopycanopy/b-ber-tasks'
import serve from '../../src/commands/serve'
import {
  flushPromises,
  mockProcessExit,
  runCli,
  spyOnLogger,
} from '../helpers/cli'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  serve: jest.fn(),
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
  serveTask.mockResolvedValue()
})

afterEach(() => jest.restoreAllMocks())

describe('serve handler', () => {
  it('serves the requested build and returns the task’s promise', async () => {
    serveTask.mockResolvedValueOnce('listening')
    await expect(serve.handler({ build: 'web', external: true })).resolves.toBe(
      'listening'
    )
    expect(serveTask).toHaveBeenCalledWith({ build: 'web', external: true })
    expect(logger.notice).toHaveBeenCalledWith('Serving [b-ber-web]')
  })

  it('leaves the default build to the task', () => {
    // The task falls back to `reader`. The notice does not know that and
    // prints `Serving [b-ber-undefined]`: cosmetic, recorded in TASK-050.
    serve.handler({})
    expect(serveTask).toHaveBeenCalledWith({
      build: undefined,
      external: undefined,
    })
    expect(logger.notice).toHaveBeenCalledWith('Serving [b-ber-undefined]')
  })

  describe('through yargs', () => {
    const served = (args) => {
      const { tasks } = runCli(['serve', ...args], ({ tasks, log }) => {
        tasks.serve.mockResolvedValue()
        spyOnLogger(log)
      })
      expect(tasks.serve).toHaveBeenCalledTimes(1)
      return tasks.serve.mock.calls[0][0]
    }

    it('passes the build positional and --external', () => {
      expect(served(['reader', '--external'])).toEqual({
        build: 'reader',
        external: true,
      })
    })

    it('accepts -e as the alias for --external', () => {
      expect(served(['web', '-e'])).toEqual({ build: 'web', external: true })
    })

    it('rejects a build that is not one of the choices', () => {
      const { tasks, utils, stoppedByFail } = runCli(
        ['serve', 'epub'],
        ({ log }) => spyOnLogger(log)
      )
      expect(stoppedByFail).toBe(true)
      expect(tasks.serve).not.toHaveBeenCalled()
      expect(utils.fail).toHaveBeenCalledWith(
        expect.stringMatching(/Invalid values/),
        undefined,
        expect.anything()
      )
    })
  })

  describe('when the task fails', () => {
    it('exits 1 when the failure reaches log.error', async () => {
      // TASK-046
      serveTask.mockImplementationOnce(async () => {
        log.error('serve failed')
      })

      await serve.handler({ build: 'reader' })

      expect(logger.error).toHaveBeenCalled()
      expect(exit).toHaveBeenCalledWith(1)
    })

    it('hands a rejection to yargs, which reports it through the command’s fail handler', async () => {
      // Defect: that handler is b-ber-lib's `fail`, which shows help and
      // calls process.exit(0).
      const error = new Error('port in use')
      const { utils } = runCli(['serve', 'reader'], ({ tasks, log }) => {
        tasks.serve.mockRejectedValue(error)
        spyOnLogger(log)
      })
      await flushPromises()

      expect(utils.fail).toHaveBeenCalledWith(null, error, expect.anything())
    })
  })
})
