import log from '@canopycanopycanopy/b-ber-logger'
import { validate } from '@canopycanopycanopy/b-ber-tasks'
import check from '../../src/commands/check'
import { mockProcessExit, runCli, spyOnLogger } from '../helpers/cli'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  validate: jest.fn(),
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

const mockYargs = () => ({
  positional: jest.fn().mockReturnThis(),
  help: jest.fn().mockReturnThis(),
  alias: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  usage: jest.fn().mockReturnThis(),
})

let exit
let logger

beforeEach(() => {
  jest.clearAllMocks()
  exit = mockProcessExit()
  logger = spyOnLogger(log)
  validate.mockResolvedValue()
})

afterEach(() => jest.restoreAllMocks())

describe('check builder', () => {
  it('declares the optional project positional and a fail handler', () => {
    const yargs = mockYargs()
    expect(check.builder(yargs)).toBe(yargs)
    expect(yargs.positional).toHaveBeenCalledWith('project', expect.any(Object))
    expect(yargs.fail).toHaveBeenCalledWith(expect.any(Function))
  })
})

describe('check handler', () => {
  it('validates the given project', () => {
    check.handler({ project: 'my-book' })
    expect(validate).toHaveBeenCalledWith({ project: 'my-book' })
  })

  it('validates the working directory when no project is given', () => {
    check.handler({})
    expect(validate).toHaveBeenCalledWith({ project: process.cwd() })
  })

  it('is reached through yargs with the positional', () => {
    const { tasks } = runCli(['check', 'my-book'], ({ log }) =>
      spyOnLogger(log)
    )
    expect(tasks.validate).toHaveBeenCalledWith({ project: 'my-book' })
  })

  describe('when the task fails', () => {
    it('exits 1 when the failure reaches log.error', async () => {
      // TASK-046: validate reports through log.error and relies on it to
      // stop the process. Note that its missing-project check never fires
      // today (#736), so a missing project fails differently; see below.
      validate.mockImplementationOnce(async () => {
        log.error('Project path does not exist, aborting')
      })

      check.handler({ project: 'missing' })
      await validate.mock.results[0].value

      expect(logger.error).toHaveBeenCalled()
      expect(exit).toHaveBeenCalledWith(1)
    })

    it('drops the task’s promise, so a rejection is unhandled', () => {
      // Defect: the handler neither returns nor catches validate's promise.
      // A rejection (e.g. readdir ENOENT on a missing project, which is how
      // a missing project actually fails because of #736) becomes an
      // unhandled rejection: Node crashes with a stack trace, not through
      // the logger, and yargs never sees it.
      const rejection = Promise.reject(new Error('ENOENT'))
      validate.mockReturnValueOnce(rejection)

      const result = check.handler({ project: 'missing' })
      // Handle it here so Jest does not fail on the unhandled rejection.
      rejection.catch(() => undefined)

      expect(result).toBeUndefined()
      expect(exit).not.toHaveBeenCalled()
    })
  })
})
