import log from '@canopycanopycanopy/b-ber-logger'
import { xml as xmlTask } from '@canopycanopycanopy/b-ber-tasks'
import * as commands from '../../src/commands'
import xml from '../../src/commands/xml'
import { mockProcessExit, spyOnLogger } from '../helpers/cli'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  xml: jest.fn(),
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
})

afterEach(() => jest.restoreAllMocks())

describe('xml handler', () => {
  it('is the xml task itself', () => {
    expect(xml.handler).toBe(xmlTask)
  })

  it('is not exported from the commands index, so `bber xml` does not exist', () => {
    // The module is kept but unregistered (commented out in
    // src/commands/index.ts). XML output is `bber build xml` instead.
    expect(commands).not.toHaveProperty('xml')
  })

  it('exits 1 when the task’s failure reaches log.error', async () => {
    // TASK-046
    xmlTask.mockImplementationOnce(async () => {
      log.error('xml failed')
    })

    await xml.handler({})

    expect(logger.error).toHaveBeenCalled()
    expect(exit).toHaveBeenCalledWith(1)
  })
})
