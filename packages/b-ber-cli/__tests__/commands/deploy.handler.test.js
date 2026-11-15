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
  it('hands the deploy task the parsed argv untouched', async () => {
    const argv = { yes: true, builds: ['epub'] }
    await deploy.handler(argv)
    expect(deployTask).toHaveBeenCalledWith(argv)
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
      const { tasks, log, stoppedByExit } = runCli(
        ['deploy', '-y', 'docx'],
        ({ log }) => spyOnLogger(log)
      )

      expect(stoppedByExit).toBe(true)
      expect(tasks.deploy).not.toHaveBeenCalled()
      // Issue 740: a usage error used to exit 0, without printing the
      // error
      expect(exit).toHaveBeenCalledWith(1)
      expect(log.errors.map((e) => e.message)).toEqual([
        expect.stringMatching(/Invalid values/),
      ])
    })
  })

  describe('when the task fails', () => {
    it('exits 1 when the failure reaches log.error, as the task’s own checks do', async () => {
      // e.g. missing AWS credentials or bucket_url: the deploy task calls
      // log.error, which throws, and the handler turns that into the exit.
      deployTask.mockImplementationOnce(async () => {
        log.error('[bucketURL] must be set in config.yml to deploy the project')
      })

      await deploy.handler({ yes: true })

      expect(logger.error).toHaveBeenCalled()
      expect(exit).toHaveBeenCalledWith(1)
    })

    it('exits 1 on any other rejection, printing it', async () => {
      // Issue 740: the rejection used to reach the command's fail handler,
      // b-ber-lib's `fail`, which showed help and exited 0.
      const error = new Error('aws s3 sync failed')
      const { log: isolatedLog } = runCli(
        ['deploy', '-y'],
        ({ tasks, log }) => {
          tasks.deploy.mockRejectedValue(error)
          spyOnLogger(log)
        }
      )
      await flushPromises()

      expect(isolatedLog.errors.map((e) => e.message)).toEqual([
        'aws s3 sync failed',
      ])
      expect(exit).toHaveBeenCalledWith(1)
    })
  })
})
