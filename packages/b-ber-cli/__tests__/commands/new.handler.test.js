import log from '@canopycanopycanopy/b-ber-logger'
import { init as Initializer } from '@canopycanopycanopy/b-ber-tasks'
import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import _new from '../../src/commands/new'
import { mockProcessExit, runCli, spyOnLogger } from '../helpers/cli'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => {
  const init = jest.fn()
  init.prototype.start = jest.fn()
  return { init }
})

jest.mock('@canopycanopycanopy/b-ber-lib/State', () =>
  require('../helpers/cli').createMockState()
)

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  ensure: jest.fn(() => Promise.resolve()),
  fail: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/Theme', () => ({}))

jest.mock('@canopycanopycanopy/b-ber-templates/Project', () => ({}))

const { start } = Initializer.prototype

let exit
let logger

beforeEach(() => {
  jest.clearAllMocks()
  exit = mockProcessExit()
  logger = spyOnLogger(log)
})

afterEach(() => jest.restoreAllMocks())

describe('new handler', () => {
  it('creates the project with the given name and starts it', async () => {
    await _new.handler({ _: ['new'], $0: 'bber', name: 'my-book' })

    expect(Initializer).toHaveBeenCalledWith({ name: 'my-book', config: {} })
    expect(start).toHaveBeenCalledTimes(1)
  })

  it('passes known config options to the new project', async () => {
    await _new.handler({
      _: ['new'],
      $0: 'bber',
      name: 'my-book',
      theme: 'b-ber-theme-sans',
      env: 'production',
    })

    expect(Initializer).toHaveBeenCalledWith({
      name: 'my-book',
      config: { theme: 'b-ber-theme-sans', env: 'production' },
    })
  })

  it('drops an unknown option with a warning', async () => {
    await _new.handler({ _: ['new'], $0: 'bber', name: 'b', bogus: 1 })

    expect(logger.warn).toHaveBeenCalledWith(
      'Invalid configuration option [%s]',
      'bogus'
    )
    expect(Initializer).toHaveBeenCalledWith({ name: 'b', config: {} })
  })

  it.each([
    'ibooks_specified_fonts',
    'autoprefixer_options',
    'downloads',
    'ui_options',
  ])('drops the blacklisted option %s with a warning', async (key) => {
    await _new.handler({ _: ['new'], $0: 'bber', name: 'b', [key]: 'x' })

    expect(logger.warn).toHaveBeenCalledWith(
      'Disallowed configuration option [%s]',
      key
    )
    expect(Initializer).toHaveBeenCalledWith({ name: 'b', config: {} })
  })

  it('resolves without waiting for the project to be created', async () => {
    // Defect: start() is neither awaited nor returned (and returns nothing:
    // the Initializer catches its own errors with log.error), so the handler
    // cannot report a failure to yargs.
    start.mockReturnValueOnce(new Promise(() => {}))
    await expect(
      _new.handler({ _: ['new'], $0: 'bber', name: 'b' })
    ).resolves.toBeUndefined()
  })

  it('exits 1 when creating the project fails through log.error', async () => {
    // TASK-046: Initializer#start ends in `.catch(log.error)`.
    start.mockImplementationOnce(() => {
      log.error(new Error('EEXIST: my-book'))
    })

    await _new.handler({ _: ['new'], $0: 'bber', name: 'my-book' })

    expect(logger.error).toHaveBeenCalled()
    expect(exit).toHaveBeenCalledWith(1)
  })

  describe('--config file', () => {
    let tmpDir

    beforeAll(async () => {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'b-ber-cli-new-'))
    })

    afterAll(() => fs.remove(tmpDir))

    it('merges the file’s options, dropping blacklisted ones, with flags winning', async () => {
      const config = path.join(tmpDir, 'config.yml')
      await fs.writeFile(
        config,
        'theme: b-ber-theme-sans\nenv: file\ndownloads: []\n'
      )

      await _new.handler({
        _: ['new'],
        $0: 'bber',
        name: 'b',
        config,
        env: 'flag',
      })

      expect(Initializer).toHaveBeenCalledWith({
        name: 'b',
        config: { theme: 'b-ber-theme-sans', env: 'flag' },
      })
      expect(logger.warn).toHaveBeenCalledWith(
        'Disallowed configuration option [%s]',
        'downloads'
      )
    })

    it('exits 1 through log.error when the file does not exist', async () => {
      const config = path.join(tmpDir, 'missing.json')

      // TASK-046: today the exit happens first; after it, only the read's
      // rejection is left.
      await expect(
        _new.handler({ _: ['new'], $0: 'bber', name: 'b', config })
      ).rejects.toThrow(/ENOENT/)

      expect(logger.error).toHaveBeenCalledWith(
        `Could not find config at [${config}]`
      )
      expect(exit).toHaveBeenCalledWith(1)
      expect(Initializer).not.toHaveBeenCalled()
    })
  })

  describe('through yargs', () => {
    it('takes the name positional and config flags', () => {
      const { tasks } = runCli(
        ['new', 'My Project', '--theme', 'b-ber-theme-sans'],
        ({ log }) => spyOnLogger(log)
      )

      expect(tasks.init).toHaveBeenCalledWith({
        name: 'My Project',
        config: { theme: 'b-ber-theme-sans' },
      })
      expect(tasks.init.prototype.start).toHaveBeenCalledTimes(1)
    })

    it('requires a name', () => {
      const { tasks, utils, stoppedByFail } = runCli(['new'], ({ log }) =>
        spyOnLogger(log)
      )

      expect(stoppedByFail).toBe(true)
      expect(tasks.init).not.toHaveBeenCalled()
      expect(utils.fail).toHaveBeenCalledWith(
        expect.stringMatching(/Not enough non-option arguments/),
        undefined,
        expect.anything()
      )
    })
  })
})
