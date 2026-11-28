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
  check: jest.fn().mockReturnThis(),
  positional: jest.fn().mockReturnThis(),
  option: jest.fn().mockReturnThis(),
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
    expect(yargs.option).toHaveBeenCalledWith(
      'strict',
      expect.objectContaining({ type: 'boolean', default: false })
    )
    expect(yargs.fail).toHaveBeenCalledWith(expect.any(Function))
  })

  it('whose fail handler shows this command’s help and exits 1', () => {
    const yargs = { ...mockYargs(), showHelp: jest.fn() }
    check.builder(yargs)

    const [handler] = yargs.fail.mock.calls[0]
    handler('Unknown argument: x', undefined)

    expect(yargs.showHelp).toHaveBeenCalled()
    expect(exit).toHaveBeenCalledWith(1)
  })
})

describe('check handler', () => {
  it('validates the given project', () => {
    check.handler({ project: 'my-book' })
    expect(validate).toHaveBeenCalledWith({ project: 'my-book', strict: false })
  })

  it('validates the working directory when no project is given', () => {
    check.handler({})
    expect(validate).toHaveBeenCalledWith({
      project: process.cwd(),
      strict: false,
    })
  })

  it('is reached through yargs with the positional', () => {
    const { tasks } = runCli(['check', 'my-book'], ({ log }) =>
      spyOnLogger(log)
    )
    expect(tasks.validate).toHaveBeenCalledWith({
      project: 'my-book',
      strict: false,
    })
  })

  it('passes --strict to the task', () => {
    const { tasks } = runCli(['check', 'my-book', '--strict'], ({ log }) =>
      spyOnLogger(log)
    )
    expect(tasks.validate).toHaveBeenCalledWith({
      project: 'my-book',
      strict: true,
    })
  })

  describe('when the task fails', () => {
    it('exits 1 when the failure reaches log.error', async () => {
      // validate reports through log.error and throws: on a missing
      // project, and when a file has an error (#796)
      validate.mockImplementationOnce(async () => {
        throw log.error('Project path does not exist, aborting')
      })

      await check.handler({ project: 'missing' })

      expect(logger.error).toHaveBeenCalled()
      expect(exit).toHaveBeenCalledWith(1)
    })

    it('exits 1 on any other rejection, printing it through the logger', async () => {
      // Issue 740: the handler used to drop validate's promise, so a
      // rejection (e.g. readdir ENOENT, which is how a missing project failed
      // until #736) was unhandled: Node crashed with a stack trace, not
      // through the logger.
      validate.mockRejectedValueOnce(new Error('ENOENT'))

      await check.handler({ project: 'missing' })

      expect(log.errors.map((e) => e.message)).toEqual(['ENOENT'])
      expect(exit).toHaveBeenCalledWith(1)
    })
  })
})
