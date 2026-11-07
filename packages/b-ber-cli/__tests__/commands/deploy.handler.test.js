import log from '@canopycanopycanopy/b-ber-logger'
import { deploy as deployTask } from '@canopycanopycanopy/b-ber-tasks'
import deploy from '../../src/commands/deploy'
import {
  flushPromises,
  mockProcessExit,
  runCli,
  spyOnLogger,
} from '../helpers/cli'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  deploy: jest.fn(),
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
  // app.ts prints its own usage text on any yargs failure.
  jest.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(() => jest.restoreAllMocks())

describe('deploy handler', () => {
  it('is the deploy task itself, so it receives the parsed argv untouched', () => {
    expect(deploy.handler).toBe(deployTask)
  })

  it('returns the task’s promise to yargs', async () => {
    deployTask.mockResolvedValueOnce('done')
    await expect(deploy.handler({ yes: true })).resolves.toBe('done')
  })

  describe('through yargs', () => {
    const deployed = (args) => {
      const { tasks } = runCli(['deploy', ...args], ({ tasks, log }) => {
        tasks.deploy.mockResolvedValue()
        spyOnLogger(log)
      })
      expect(tasks.deploy).toHaveBeenCalledTimes(1)
      return tasks.deploy.mock.calls[0][0]
    }

    it('passes --yes through as `yes`', () => {
      expect(deployed(['--yes'])).toEqual(
        expect.objectContaining({ yes: true, y: true })
      )
    })

    it('accepts -y as the alias for --yes', () => {
      expect(deployed(['-y'])).toEqual(
        expect.objectContaining({ yes: true, y: true })
      )
    })

    it('leaves `yes` unset without the flag, so the task prompts', () => {
      expect(deployed([]).yes).toBeUndefined()
    })

    it('passes the builds positional through as an array', () => {
      expect(deployed(['-y', 'epub', 'web'])).toEqual(
        expect.objectContaining({ yes: true, builds: ['epub', 'web'] })
      )
    })

    it('rejects a build that is not one of the choices', () => {
      const { tasks, utils, stoppedByFail } = runCli(
        ['deploy', '-y', 'docx'],
        ({ log }) => spyOnLogger(log)
      )

      expect(stoppedByFail).toBe(true)
      expect(tasks.deploy).not.toHaveBeenCalled()
      expect(utils.fail).toHaveBeenCalledWith(
        expect.stringMatching(/Invalid values/),
        undefined,
        expect.anything()
      )
    })
  })

  describe('when the task fails', () => {
    it('exits 1 when the failure reaches log.error, as the task’s own checks do', async () => {
      // e.g. missing AWS credentials or bucket_url: the deploy task calls
      // log.error and relies on it to stop the process. TASK-046: once
      // log.error stops exiting, the CLI has to supply this exit itself.
      deployTask.mockImplementationOnce(async () => {
        log.error('[bucketURL] must be set in config.yml to deploy the project')
      })

      await deploy.handler({ yes: true })

      expect(logger.error).toHaveBeenCalled()
      expect(exit).toHaveBeenCalledWith(1)
    })

    it('hands a rejection to yargs, which reports it through the command’s fail handler', async () => {
      // Defect: the fail handler is b-ber-lib's `fail`, which shows help and
      // calls process.exit(0), so a failed deploy exits with status 0.
      const error = new Error('aws s3 sync failed')
      const { utils } = runCli(['deploy', '-y'], ({ tasks, log }) => {
        tasks.deploy.mockRejectedValue(error)
        spyOnLogger(log)
      })
      await flushPromises()

      expect(utils.fail).toHaveBeenCalledWith(null, error, expect.anything())
    })
  })
})
