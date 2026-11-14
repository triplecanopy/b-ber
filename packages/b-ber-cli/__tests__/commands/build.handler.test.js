import os from 'node:os'
import path from 'node:path'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { ensure } from '@canopycanopycanopy/b-ber-lib/utils'
import log from '@canopycanopycanopy/b-ber-logger'
import sequences from '@canopycanopycanopy/b-ber-shapes-sequences/sequences'
import { serialize } from '@canopycanopycanopy/b-ber-tasks'
import Project from '@canopycanopycanopy/b-ber-templates/Project'
import fs from 'fs-extra'
import build from '../../src/commands/build'
import { flushPromises, mockProcessExit, spyOnLogger } from '../helpers/cli'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  serialize: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/State', () =>
  require('../helpers/cli').createMockState()
)

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  ensure: jest.fn(),
  fail: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-templates/Project', () => ({
  javascripts: jest.fn(() => [{ absolutePath: 'application.js' }]),
  stylesheets: jest.fn(() => []),
}))

// Object.keys order, which is the order `bber build` runs them in.
const FORMATS = ['epub', 'mobi', 'pdf', 'web', 'sample', 'reader', 'xml']

const mockYargs = () => ({
  option: jest.fn().mockReturnThis(),
  command: jest.fn().mockReturnThis(),
  help: jest.fn().mockReturnThis(),
  alias: jest.fn().mockReturnThis(),
})

const updatesTo = (key) =>
  state.update.mock.calls.filter(([k]) => k === key).map(([, v]) => v)

let exit
let logger

beforeEach(() => {
  jest.clearAllMocks()
  exit = mockProcessExit()
  logger = spyOnLogger(log)
  jest.spyOn(console, 'error').mockImplementation(() => undefined)
  ensure.mockResolvedValue()
  serialize.mockResolvedValue()
})

afterEach(() => jest.restoreAllMocks())

describe('build builder', () => {
  it('registers every format as a sub-command sharing the one handler', () => {
    const yargs = mockYargs()
    build.builder(yargs)

    const registered = yargs.command.mock.calls.map(([name]) => name)
    expect(registered).toEqual(['', ...FORMATS.slice().sort()])
    for (const [, , builder, handler] of yargs.command.mock.calls) {
      expect(builder).toEqual(expect.any(Function))
      expect(handler).toBe(build.handler)
    }
  })

  it('applies the shared config options', () => {
    const yargs = mockYargs()
    build.builder(yargs)
    expect(yargs.option).toHaveBeenCalledWith('config', expect.any(Object))
  })

  it('omits xml from the command string although it registers an xml sub-command', () => {
    // Defect: `bber build --help` does not list xml. The sub-command works
    // (see app.test.js), the usage string is just out of date.
    expect(build.command).not.toMatch(/xml/)
  })
})

describe('build handler', () => {
  describe.each(FORMATS)('bber build %s', (format) => {
    beforeEach(async () => {
      await build.handler({ _: ['build', format], $0: 'bber' })
      await flushPromises()
    })

    it('serializes only that format’s sequence', () => {
      expect(serialize).toHaveBeenCalledTimes(1)
      expect(serialize).toHaveBeenCalledWith(sequences[format])
    })

    it('records the sequence and the build in State', () => {
      expect(updatesTo('sequence')).toEqual([sequences[format]])
      expect(updatesTo('build')).toEqual([format])
      expect(state.reset).toHaveBeenCalledTimes(1)
    })

    it('registers the sequence with the logger', () => {
      expect(logger.registerSequence).toHaveBeenCalledWith(
        state,
        build.command,
        sequences[format]
      )
    })

    it('does not exit', () => {
      expect(exit).not.toHaveBeenCalled()
    })
  })

  describe('bber build (no format)', () => {
    it('builds every format, one after another, resetting State between', async () => {
      await build.handler({ _: ['build'], $0: 'bber' })
      await flushPromises()

      expect(serialize.mock.calls.map(([seq]) => seq)).toEqual(
        FORMATS.map((f) => sequences[f])
      )
      expect(updatesTo('build')).toEqual(FORMATS)
      expect(state.reset).toHaveBeenCalledTimes(FORMATS.length)
      expect(updatesTo('sequence')).toEqual([
        FORMATS.flatMap((f) => sequences[f]),
      ])
    })

    it('waits for each format to finish before starting the next', async () => {
      let finishEpub
      serialize.mockImplementationOnce(
        () => new Promise((resolve) => (finishEpub = resolve))
      )

      await build.handler({ _: ['build'], $0: 'bber' })
      await flushPromises()
      expect(serialize).toHaveBeenCalledTimes(1)

      finishEpub()
      await flushPromises()
      expect(serialize).toHaveBeenCalledTimes(FORMATS.length)
    })
  })

  it('ensures the project’s scripts and stylesheets exist before building', async () => {
    await build.handler({ _: ['build', 'epub'], $0: 'bber' })
    await flushPromises()

    expect(Project.javascripts).toHaveBeenCalledWith(path.resolve('_project'))
    expect(ensure).toHaveBeenCalledWith({
      files: [{ absolutePath: 'application.js' }],
    })
    expect(ensure.mock.invocationCallOrder[0]).toBeLessThan(
      serialize.mock.invocationCallOrder[0]
    )
  })

  it('resolves before the build has run', async () => {
    // Defect: the handler does not return or await the ensure/serialize
    // chain, so its promise says nothing about whether the build finished or
    // failed. yargs therefore never sees a build failure.
    let finishEnsure
    ensure.mockReturnValueOnce(
      new Promise((resolve) => (finishEnsure = resolve))
    )

    await expect(
      build.handler({ _: ['build', 'epub'], $0: 'bber' })
    ).resolves.toBeUndefined()
    expect(serialize).not.toHaveBeenCalled()

    finishEnsure()
    await flushPromises()
    expect(serialize).toHaveBeenCalledTimes(1)
  })

  describe('NODE_ENV', () => {
    const saved = process.env.NODE_ENV
    afterEach(() => {
      process.env.NODE_ENV = saved
    })

    it('defaults to development', async () => {
      delete process.env.NODE_ENV
      await build.handler({ _: ['build', 'epub'], $0: 'bber' })
      expect(process.env.NODE_ENV).toBe('development')
    })

    it('keeps a value already set', async () => {
      process.env.NODE_ENV = 'production'
      await build.handler({ _: ['build', 'epub'], $0: 'bber' })
      expect(process.env.NODE_ENV).toBe('production')
    })
  })

  describe('config options', () => {
    it('applies a known option to State', async () => {
      await build.handler({ _: ['build', 'epub'], $0: 'bber', env: 'prod' })
      await flushPromises()

      expect(updatesTo('config.env')).toEqual(['prod'])
      expect(logger.notice).toHaveBeenCalledWith(
        'Applying configuration option [%s]:[%s]',
        'env',
        'prod'
      )
    })

    it('drops an unknown option with a warning', async () => {
      await build.handler({ _: ['build', 'epub'], $0: 'bber', bogus: 1 })
      await flushPromises()

      expect(logger.warn).toHaveBeenCalledWith(
        'Invalid configuration option [%s]',
        'bogus'
      )
      expect(updatesTo('config.bogus')).toEqual([])
    })

    it.each([
      'ibooks_specified_fonts',
      'autoprefixer_options',
      'downloads',
      'ui_options',
    ])('drops the blacklisted option %s with a warning', async (key) => {
      await build.handler({ _: ['build', 'epub'], $0: 'bber', [key]: 'x' })
      await flushPromises()

      expect(logger.warn).toHaveBeenCalledWith(
        'Disallowed configuration option [%s]',
        key
      )
      expect(updatesTo(`config.${key}`)).toEqual([])
    })

    it.each([
      'bucket_url',
      'remote_javascripts',
      'remote_stylesheets',
    ])('drops the advertised --%s flag unless config.yml already sets it', async (key) => {
      // Defect: withConfigOptions offers these flags, but they are not keys
      // of b-ber-lib's default Config, so `state.has` rejects them as
      // invalid for any project whose config.yml does not define them.
      await build.handler({ _: ['build', 'epub'], $0: 'bber', [key]: 'x' })
      await flushPromises()

      expect(logger.warn).toHaveBeenCalledWith(
        'Invalid configuration option [%s]',
        key
      )
      expect(updatesTo(`config.${key}`)).toEqual([])
    })

    it('re-applies the options to every format after State is reset', async () => {
      await build.handler({ _: ['build'], $0: 'bber', env: 'prod' })
      await flushPromises()

      expect(updatesTo('config.env')).toEqual(FORMATS.map(() => 'prod'))
    })

    describe('--config file', () => {
      let tmpDir

      beforeAll(async () => {
        tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'b-ber-cli-build-'))
      })

      afterAll(() => fs.remove(tmpDir))

      it('merges the file’s options, with command-line flags winning', async () => {
        const config = path.join(tmpDir, 'config.json')
        await fs.writeJson(config, { theme: 'b-ber-theme-sans', env: 'file' })

        await build.handler({
          _: ['build', 'epub'],
          $0: 'bber',
          config,
          env: 'flag',
        })
        await flushPromises()

        expect(updatesTo('config.theme')).toEqual(['b-ber-theme-sans'])
        expect(updatesTo('config.env')).toEqual(['flag'])
        expect(updatesTo('config.config')).toEqual([])
      })

      it('drops blacklisted keys that come from the file', async () => {
        const config = path.join(tmpDir, 'blacklisted.json')
        await fs.writeJson(config, { downloads: [] })

        await build.handler({ _: ['build', 'epub'], $0: 'bber', config })
        await flushPromises()

        expect(logger.warn).toHaveBeenCalledWith(
          'Disallowed configuration option [%s]',
          'downloads'
        )
        expect(updatesTo('config.downloads')).toEqual([])
      })

      it('exits 1 through log.error when the file does not exist', async () => {
        const config = path.join(tmpDir, 'missing.json')

        // With process.exit stubbed, parseConfigFile runs on past log.error
        // and the read fails. TASK-046: today the exit happens first; after
        // it, only this rejection is left.
        await expect(
          build.handler({ _: ['build', 'epub'], $0: 'bber', config })
        ).rejects.toThrow(/ENOENT/)
        await flushPromises()

        expect(logger.error).toHaveBeenCalledWith(
          `Could not find config at [${config}]`
        )
        expect(exit).toHaveBeenCalledWith(1)
        expect(serialize).not.toHaveBeenCalled()
      })

      it('exits 1 through log.error when the file is not JSON or YAML', async () => {
        const config = path.join(tmpDir, 'config.txt')
        await fs.writeFile(config, '{}')

        await build.handler({ _: ['build', 'epub'], $0: 'bber', config })

        expect(logger.error).toHaveBeenCalledWith(
          'Config file must have a .json or .yaml/.yml file extension'
        )
        expect(exit).toHaveBeenCalledWith(1)
      })
    })
  })

  describe('when a task fails', () => {
    it('exits 1 when the failure reaches log.error, as every real task failure does', async () => {
      // b-ber-tasks' serialize ends in `.catch(log.error)`, so a failing
      // build task never rejects back to the CLI: the exit comes from the
      // logger. TASK-046: once log.error stops exiting, nothing in the CLI
      // turns this failure into a non-zero exit, and this test fails.
      const error = new Error('render failed')
      serialize.mockImplementationOnce(() =>
        Promise.reject(error).catch(log.error)
      )

      await build.handler({ _: ['build', 'epub'], $0: 'bber' })
      await flushPromises()

      expect(logger.error).toHaveBeenCalledWith(error)
      expect(exit).toHaveBeenCalledWith(1)
      expect(exit).toHaveBeenCalledTimes(1)
    })

    it('swallows a rejection into console.error and does not exit', async () => {
      // Defect: a rejection that reaches the handler (from ensure or
      // serialize) is caught by `.catch(console.error)`, so the process
      // ends with status 0. This becomes the main failure path if TASK-046
      // makes log.error re-throw.
      const error = new Error('serialize rejected')
      serialize.mockRejectedValueOnce(error)

      await build.handler({ _: ['build', 'epub'], $0: 'bber' })
      await flushPromises()

      expect(console.error).toHaveBeenCalledWith(error)
      expect(exit).not.toHaveBeenCalled()
    })

    it('swallows an ensure rejection the same way, without building', async () => {
      const error = new Error('ensure rejected')
      ensure.mockRejectedValueOnce(error)

      await build.handler({ _: ['build', 'epub'], $0: 'bber' })
      await flushPromises()

      expect(console.error).toHaveBeenCalledWith(error)
      expect(serialize).not.toHaveBeenCalled()
      expect(exit).not.toHaveBeenCalled()
    })

    it('loses a rejection from any format after the first', async () => {
      // Defect: run() starts the next format inside `.then` without
      // returning it, so a rejection from the second format onward never
      // reaches `.catch(console.error)`. In Node it is an unhandled
      // rejection, which crashes the process with a stack trace.
      //
      // To record it here rather than fail Jest with an unhandled
      // rejection, the second serialize's promise catches whatever run()
      // chains onto it.
      const error = new Error('mobi failed')
      const escaped = []

      serialize.mockResolvedValueOnce().mockImplementationOnce(() => {
        const promise = Promise.reject(error)
        const then = promise.then.bind(promise)
        promise.then = (...args) => {
          const derived = then(...args)
          derived.catch((e) => escaped.push(e))
          return derived
        }
        return promise
      })

      await build.handler({ _: ['build'], $0: 'bber' })
      await flushPromises()

      expect(serialize).toHaveBeenCalledTimes(2)
      expect(escaped).toEqual([error])
      expect(console.error).not.toHaveBeenCalled()
      expect(exit).not.toHaveBeenCalled()
    })
  })
})
