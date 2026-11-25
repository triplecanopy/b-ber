import os from 'node:os'
import path from 'node:path'
import { loadProject, runBuild } from '@canopycanopycanopy/b-ber-lib'
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

jest.mock('@canopycanopycanopy/b-ber-lib', () =>
  require('../helpers/cli').createMockBuildApi()
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
  check: jest.fn().mockReturnThis(),
  option: jest.fn().mockReturnThis(),
  command: jest.fn().mockReturnThis(),
  help: jest.fn().mockReturnThis(),
  alias: jest.fn().mockReturnThis(),
  usage: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
})

const updatesTo = (key) =>
  state.update.mock.calls.filter(([k]) => k === key).map(([, v]) => v)

// The overrides the handler read the project with
const overrides = () => loadProject.mock.calls.map(([, o]) => o)

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
  it('registers a fail handler that shows this command’s help and exits 1', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined)
    const write = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true)
    const yargs = { ...mockYargs(), showHelp: jest.fn() }
    build.builder(yargs)

    const [handler] = yargs.fail.mock.calls[0]
    handler('Unknown argument: x', undefined)

    expect(yargs.showHelp).toHaveBeenCalled()
    expect(exit).toHaveBeenCalledWith(1)
    exit.mockRestore()
    write.mockRestore()
  })

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

  it('registers a fail handler, so a usage error is reported and exits 1', () => {
    // Issue 741: build used to register none, so a usage error printed
    // app.ts's generic usage text and never the error
    const yargs = mockYargs()
    build.builder(yargs)
    expect(yargs.fail).toHaveBeenCalledWith(expect.any(Function))
  })

  it('lists every format in its usage line, xml included', () => {
    // Issue 741: the hand-written command string left out xml. The line is
    // built from the sequences now, so it lists whatever `bber build` builds.
    const yargs = mockYargs()
    build.builder(yargs)

    const [[usage]] = yargs.usage.mock.calls
    expect(usage).toContain(`build [${Object.keys(sequences).join('|')}]`)
    expect(Object.keys(sequences)).toEqual(FORMATS)
  })

  it('takes no positional, which would hide an unknown format from the check', () => {
    expect(build.command).toBe('build')
  })

  it('registers a global check that rejects an unknown format', () => {
    const yargs = mockYargs()
    build.builder(yargs)

    // Global (no second argument), so it also runs inside the format
    // sub-command that matched
    const [[check, global]] = yargs.check.mock.calls
    expect(global).toBeUndefined()
    expect(check({ _: ['build', 'epub', 'web'] })).toBe(true)
    expect(check({ _: ['build', 'ebup'] })).toBe('Unknown format: ebup')
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

    it('records the sequence, and builds the format in its own context', () => {
      expect(updatesTo('sequence')).toEqual([sequences[format]])
      expect(runBuild).toHaveBeenCalledTimes(1)
      expect(runBuild.mock.calls[0][1]).toEqual([format])
      // State is no longer reset and switched between builds (TASK-163)
      expect(updatesTo('build')).toEqual([])
      expect(state.reset).not.toHaveBeenCalled()
    })

    it('reads the project once, from the working directory', () => {
      expect(loadProject).toHaveBeenCalledTimes(1)
      expect(loadProject).toHaveBeenCalledWith(process.cwd(), {})
    })

    it('registers the sequence with the logger', () => {
      expect(logger.registerSequence).toHaveBeenCalledWith([
        { name: format, tasks: sequences[format] },
      ])
    })

    it('does not exit', () => {
      expect(exit).not.toHaveBeenCalled()
    })
  })

  describe('bber build (no format)', () => {
    it('builds every format, one after another, each in its own context', async () => {
      await build.handler({ _: ['build'], $0: 'bber' })
      await flushPromises()

      expect(serialize.mock.calls.map(([seq]) => seq)).toEqual(
        FORMATS.map((f) => sequences[f])
      )
      expect(runBuild.mock.calls[0][1]).toEqual(FORMATS)
      expect(state.reset).not.toHaveBeenCalled()
      expect(updatesTo('sequence')).toEqual([
        FORMATS.flatMap((f) => sequences[f]),
      ])
    })

    it('registers each format and its tasks with the logger, in order', async () => {
      await build.handler({ _: ['build'], $0: 'bber' })
      await flushPromises()

      expect(logger.registerSequence).toHaveBeenCalledTimes(1)
      expect(logger.registerSequence).toHaveBeenCalledWith(
        FORMATS.map((name) => ({ name, tasks: sequences[name] }))
      )
    })

    it('waits for each format to finish before starting the next', async () => {
      let finishEpub
      serialize.mockImplementationOnce(
        () => new Promise((resolve) => (finishEpub = resolve))
      )

      const handled = build.handler({ _: ['build'], $0: 'bber' })
      await flushPromises()
      expect(serialize).toHaveBeenCalledTimes(1)

      finishEpub()
      await handled
      expect(serialize).toHaveBeenCalledTimes(FORMATS.length)
    })
  })

  it('ensures the project’s scripts and stylesheets exist before building', async () => {
    await build.handler({ _: ['build', 'epub'], $0: 'bber' })
    await flushPromises()

    expect(Project.javascripts).toHaveBeenCalledWith(path.resolve('_project'))
    expect(ensure).toHaveBeenCalledWith({
      files: [{ absolutePath: 'application.js' }],
      src: '_project',
    })
    expect(ensure.mock.invocationCallOrder[0]).toBeLessThan(
      serialize.mock.invocationCallOrder[0]
    )
  })

  it('resolves once the build has run', async () => {
    // Issue 740: the handler used to resolve before the ensure/serialize
    // chain had run, so nothing could see a build failure
    let finishEnsure
    ensure.mockReturnValueOnce(
      new Promise((resolve) => (finishEnsure = resolve))
    )

    let resolved = false
    const handled = build
      .handler({ _: ['build', 'epub'], $0: 'bber' })
      .then(() => (resolved = true))
    await flushPromises()
    expect(resolved).toBe(false)
    expect(serialize).not.toHaveBeenCalled()

    finishEnsure()
    await handled
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

  it('applies a --src flag before the project is read', async () => {
    // TASK-162, audit bug 1: the flag used to arrive after State had read the
    // project from config.yml's src, and `ensure` scaffolded the wrong one
    await build.handler({ _: ['build', 'epub'], $0: 'bber', src: 'content' })
    await flushPromises()

    expect(overrides()).toEqual([{ src: 'content' }])
    expect(Project.javascripts).toHaveBeenCalledWith(path.resolve('content'))
    // and scaffolds that directory, not `_project`
    expect(ensure).toHaveBeenCalledWith(
      expect.objectContaining({ src: 'content' })
    )
  })

  describe('config options', () => {
    it('reads the project with a known option', async () => {
      await build.handler({ _: ['build', 'epub'], $0: 'bber', env: 'prod' })
      await flushPromises()

      expect(overrides()).toEqual([{ env: 'prod' }])
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
      expect(overrides()).toEqual([{}])
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
      expect(overrides()).toEqual([{}])
    })

    it.each(['bucket_url', 'remote_javascripts', 'remote_stylesheets'])(
      'drops the advertised --%s flag unless config.yml already sets it',
      async (key) => {
        // Defect: withConfigOptions offers these flags, but they are not keys
        // of b-ber-lib's default Config, so `state.has` rejects them as
        // invalid for any project whose config.yml does not define them.
        await build.handler({ _: ['build', 'epub'], $0: 'bber', [key]: 'x' })
        await flushPromises()

        expect(logger.warn).toHaveBeenCalledWith(
          'Invalid configuration option [%s]',
          key
        )
        expect(overrides()).toEqual([{}])
      }
    )

    it('applies the options to every format, announcing each once', async () => {
      await build.handler({ _: ['build'], $0: 'bber', env: 'prod' })
      await flushPromises()

      // One project for every format; each format's context resolves the
      // overrides over config.yml and its own section
      expect(overrides()).toEqual([{ env: 'prod' }])
      expect(runBuild.mock.calls[0][0].overrides).toEqual({ env: 'prod' })
      expect(
        logger.notice.mock.calls.filter(([, key]) => key === 'env')
      ).toHaveLength(1)
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

        // `config` names the file; it is not an option itself
        expect(overrides()).toEqual([
          { theme: 'b-ber-theme-sans', env: 'flag' },
        ])
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
        expect(overrides()).toEqual([{}])
      })

      it('exits 1 through log.error when the file does not exist', async () => {
        const config = path.join(tmpDir, 'missing.json')

        // parseConfigFile throws what log.error returns, so it stops there: the file is
        // never read
        await build.handler({ _: ['build', 'epub'], $0: 'bber', config })

        expect(logger.error).toHaveBeenCalledWith(
          `Could not find config at [${config}]`
        )
        expect(log.errors.map((e) => e.message)).toEqual([
          `Could not find config at [${config}]`,
        ])
        expect(exit).toHaveBeenCalledTimes(1)
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
        expect(serialize).not.toHaveBeenCalled()
      })
    })
  })

  describe('when a task fails', () => {
    it('exits 1 when the failure reaches log.error, as every real task failure does', async () => {
      // b-ber-tasks' serialize ends in a catch that prints the
      // failure and rethrows it: the handler turns it into the exit, without
      // printing it again.
      const error = new Error('render failed')
      serialize.mockImplementationOnce(() =>
        Promise.reject(error).catch((err) => {
          throw log.error(err)
        })
      )

      await build.handler({ _: ['build', 'epub'], $0: 'bber' })
      await flushPromises()

      expect(logger.error).toHaveBeenCalledWith(error)
      expect(log.errors).toHaveLength(1)
      expect(exit).toHaveBeenCalledWith(1)
      expect(exit).toHaveBeenCalledTimes(1)
    })

    it('exits 1 on a rejection the logger has not reported, printing it', async () => {
      // Issue 740: `.catch(console.error)` used to catch a rejection that
      // reached the handler (from ensure or serialize), so the process ended
      // with status 0.
      const error = new Error('serialize rejected')
      serialize.mockRejectedValueOnce(error)

      await build.handler({ _: ['build', 'epub'], $0: 'bber' })

      expect(log.errors.map((e) => e.message)).toEqual(['serialize rejected'])
      expect(console.error).not.toHaveBeenCalled()
      expect(exit).toHaveBeenCalledWith(1)
    })

    it('exits 1 on an ensure rejection the same way, without building', async () => {
      const error = new Error('ensure rejected')
      ensure.mockRejectedValueOnce(error)

      await build.handler({ _: ['build', 'epub'], $0: 'bber' })

      expect(log.errors.map((e) => e.message)).toEqual(['ensure rejected'])
      expect(serialize).not.toHaveBeenCalled()
      expect(exit).toHaveBeenCalledWith(1)
    })

    it('exits 1 when a format after the first fails, building no more', async () => {
      // Issue 740: run() used to start the next format inside `.then`
      // without returning it, so a rejection from the second format onward
      // was unhandled: Node crashed with a stack trace, not through the
      // logger.
      const error = new Error('mobi failed')
      serialize.mockResolvedValueOnce().mockRejectedValueOnce(error)

      await build.handler({ _: ['build'], $0: 'bber' })

      expect(serialize).toHaveBeenCalledTimes(2)
      expect(log.errors.map((e) => e.message)).toEqual(['mobi failed'])
      expect(exit).toHaveBeenCalledWith(1)
    })
  })
})
