import pkg from '../package.json'

// src/index.ts is the `bber` binary: it runs on require.

jest.mock('../src/app', () => ({ __esModule: true, default: jest.fn() }))

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

const interopDefault = (mod) => (mod?.__esModule ? mod.default : mod)

// The binary loads the app with a dynamic import, which runs after
// isolateModules has returned, so it gets the app from the shared registry
const app = require('../src/app').default

const runBin = (args) => {
  const savedArgv = process.argv
  process.argv = ['node', 'bber', ...args]
  const modules = { app }
  try {
    jest.isolateModules(() => {
      modules.log = interopDefault(require('@canopycanopycanopy/b-ber-logger'))
      modules.configure = jest.spyOn(modules.log, 'configure')
      require('../src/index')
    })
  } finally {
    process.argv = savedArgv
  }
  return modules
}

let on
let savedExitCode

beforeEach(() => {
  app.mockClear()
  savedExitCode = process.exitCode
  jest.spyOn(console, 'log').mockImplementation(() => undefined)
  // The binary installs process-wide handlers; keep them off the test runner
  on = jest.spyOn(process, 'on').mockImplementation(() => process)
})

afterEach(() => {
  jest.restoreAllMocks()
  // The binary sets exit status 1 when the logger reports an error, which
  // would otherwise become the test run's
  process.exitCode = savedExitCode
})

describe('bber binary', () => {
  it.each([
    '--version',
    '-v',
  ])('prints the package version for %s', async (flag) => {
    const { app, configure } = runBin([flag])
    await flushPromises()
    expect(console.log).toHaveBeenCalledWith(pkg.version)
    expect(app).not.toHaveBeenCalled()
    expect(configure).not.toHaveBeenCalled()
  })

  it('hands every other invocation to the yargs app', async () => {
    const { app } = runBin(['build', 'epub'])
    await flushPromises()
    expect(app).toHaveBeenCalledTimes(1)
    expect(console.log).not.toHaveBeenCalled()
  })

  it('configures the logger from the command line before loading the app', async () => {
    const { app, configure } = runBin(['build', '--quiet', '--no-color'])
    expect(configure).toHaveBeenCalledWith({ logLevel: 0, boringOutput: true })
    expect(app).not.toHaveBeenCalled()
    await flushPromises()
    expect(configure.mock.invocationCallOrder[0]).toBeLessThan(
      app.mock.invocationCallOrder[0]
    )
  })

  it('exits through the logger on an uncaught exception or unhandled rejection', () => {
    runBin(['build'])
    const events = on.mock.calls.map(([event]) => event)
    expect(events).toEqual(
      expect.arrayContaining(['uncaughtException', 'unhandledRejection'])
    )
  })

  it('exits 1 when an uncaught failure reaches its handler', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined)
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const { log } = runBin(['build'])
    const [, handler] = on.mock.calls.find(
      ([event]) => event === 'uncaughtException'
    )
    log.reset()

    handler(new Error('crashed'))

    expect(log.errors.map((e) => e.message)).toEqual(['crashed'])
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('sets exit status 1 on any error the logger reports, without exiting', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined)
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const { log } = runBin(['build'])

    // A site that reports and then fails to stop
    log.error('reported, not thrown')

    expect(process.exitCode).toBe(1)
    expect(exit).not.toHaveBeenCalled()
  })
})
