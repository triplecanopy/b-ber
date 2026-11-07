import { ensure } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'
import { generate as generateTask } from '@canopycanopycanopy/b-ber-tasks'
import generate from '../../src/commands/generate'
import {
  flushPromises,
  mockProcessExit,
  runCli,
  spyOnLogger,
} from '../helpers/cli'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  generate: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/State', () =>
  require('../helpers/cli').createMockState()
)

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  ensure: jest.fn(),
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
  jest.spyOn(console, 'error').mockImplementation(() => undefined)
  ensure.mockResolvedValue()
  generateTask.mockResolvedValue()
})

afterEach(() => jest.restoreAllMocks())

describe('generate handler', () => {
  it('ensures the project exists, then generates the chapter', async () => {
    await generate.handler({ title: 'Chapter One', type: 'bodymatter' })

    expect(ensure).toHaveBeenCalledWith()
    expect(generateTask).toHaveBeenCalledWith({
      title: 'Chapter One',
      type: 'bodymatter',
    })
    expect(ensure.mock.invocationCallOrder[0]).toBeLessThan(
      generateTask.mock.invocationCallOrder[0]
    )
  })

  it('is reached through yargs with the title and type positionals', async () => {
    const { tasks, utils } = runCli(
      ['generate', 'Chapter One', 'frontmatter'],
      ({ utils, log }) => {
        utils.ensure.mockResolvedValue()
        spyOnLogger(log)
      }
    )
    await flushPromises()

    expect(utils.ensure).toHaveBeenCalled()
    expect(tasks.generate).toHaveBeenCalledWith({
      title: 'Chapter One',
      type: 'frontmatter',
    })
  })

  describe('when the task fails', () => {
    it('exits 1 when the failure reaches log.error', async () => {
      // TASK-046: e.g. "already exists, aborting" in the generate task.
      generateTask.mockImplementationOnce(async () => {
        log.error('_markdown/chapter-one.md already exists, aborting')
      })

      await generate.handler({ title: 'Chapter One' })

      expect(logger.error).toHaveBeenCalled()
      expect(exit).toHaveBeenCalledWith(1)
    })

    it('swallows a rejection into console.error and does not exit', async () => {
      // Defect: `.catch(console.error)` ends the process with status 0.
      const error = new Error('generate rejected')
      generateTask.mockRejectedValueOnce(error)

      await expect(
        generate.handler({ title: 'Chapter One' })
      ).resolves.toBeUndefined()

      expect(console.error).toHaveBeenCalledWith(error)
      expect(exit).not.toHaveBeenCalled()
    })

    it('swallows an ensure rejection the same way, without generating', async () => {
      const error = new Error('ensure rejected')
      ensure.mockRejectedValueOnce(error)

      await generate.handler({ title: 'Chapter One' })

      expect(console.error).toHaveBeenCalledWith(error)
      expect(generateTask).not.toHaveBeenCalled()
      expect(exit).not.toHaveBeenCalled()
    })
  })
})
