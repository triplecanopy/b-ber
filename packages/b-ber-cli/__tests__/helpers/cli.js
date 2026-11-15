// Shared fixtures for the b-ber-cli handler tests.
//
// The handler tests call each command's yargs handler directly, with
// b-ber-tasks and b-ber-lib's State mocked, and the real b-ber-logger. The
// logger is deliberately real: `log.error` reports and throws, and the
// handler's wrapper (src/lib/exit.ts) turns what it throws into
// `process.exit(1)`. Every assertion on that is
// `expect(exit).toHaveBeenCalledWith(1)` against the spy from
// `mockProcessExit`.

// Resolves once every promise callback queued so far has run, for the runs
// through yargs, which does not hand back the handler's promise.
const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

// A stand-in for b-ber-lib's State singleton. `config` is the real
// b-ber-lib Config defaults, so `state.has('config.<key>')` answers as it does
// in a project with no config.yml. Loaded by relative path because the
// package's own jest config has no mapping for `b-ber-lib/Config`.
const createMockState = () => {
  const { default: Config } = require('../../../b-ber-lib/src/Config')
  const state = {
    version: '0.0.0-test',
    srcDir: '_project',
    config: new Config(),
    has: jest.fn(
      (key) =>
        key.startsWith('config.') &&
        Object.hasOwn(state.config, key.slice('config.'.length))
    ),
    update: jest.fn(),
    reset: jest.fn(),
  }
  return state
}

// Replaces process.exit with a no-op, so that a test can assert on the exit
// and carry on.
const mockProcessExit = () => {
  // The logger writes its report to stdout before the exit.
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
  return jest.spyOn(process, 'exit').mockImplementation(() => undefined)
}

// Silences the logger's chatty levels so they can be asserted on. `error` is
// spied on but passes through, so that it still throws and records the error
// in `log.errors`, which this empties first.
const spyOnLogger = (log) => {
  log.reset()
  return {
    warn: jest.spyOn(log, 'warn').mockImplementation(() => undefined),
    notice: jest.spyOn(log, 'notice').mockImplementation(() => undefined),
    info: jest.spyOn(log, 'info').mockImplementation(() => undefined),
    registerSequence: jest
      .spyOn(log, 'registerSequence')
      .mockImplementation(() => undefined),
    error: jest.spyOn(log, 'error'),
  }
}

const interopDefault = (mod) => (mod?.__esModule ? mod.default : mod)

// b-ber-lib's `fail`, which most commands register as their yargs fail
// handler, ends the process with process.exit(0). With process.exit stubbed
// nothing would stop yargs from going on to run the handler, so during the
// parse the mocked `fail` throws this instead.
class StoppedByFail extends Error {}

// Runs `bber <args>` in-process through the real yargs wiring in src/app.ts.
// yargs reads process.argv when it is first required, so each run gets a
// fresh module registry. The modules the run used are returned so the test
// can assert on the same mock instances; `setup` gets them before the parse,
// to set mock behaviour and spies. `stoppedByFail` says whether a fail
// handler ended the run during the parse (a validation error). After the
// parse `fail` only records its calls: a rejected handler promise reaches it
// later, from a promise callback, where a throw would be unhandled.
//
// The calling test file must jest.mock b-ber-tasks, b-ber-lib's State, utils
// and Theme, and b-ber-templates' Project.
const runCli = (args, setup = () => {}) => {
  const savedArgv = process.argv
  const modules = { stoppedByFail: false }

  process.argv = ['node', 'bber', ...args]

  try {
    jest.isolateModules(() => {
      modules.tasks = require('@canopycanopycanopy/b-ber-tasks')
      modules.state = require('@canopycanopycanopy/b-ber-lib/State')
      modules.utils = require('@canopycanopycanopy/b-ber-lib/utils')
      modules.Theme = require('@canopycanopycanopy/b-ber-lib/Theme')
      modules.log = interopDefault(require('@canopycanopycanopy/b-ber-logger'))
      modules.utils.fail.mockImplementation((msg) => {
        throw new StoppedByFail(msg)
      })
      setup(modules)
      try {
        modules.argv = interopDefault(require('../../src/app'))()
      } catch (err) {
        if (!(err instanceof StoppedByFail)) throw err
        modules.stoppedByFail = true
      } finally {
        modules.utils.fail.mockImplementation(() => undefined)
      }
    })
  } finally {
    process.argv = savedArgv
  }

  return modules
}

module.exports = {
  createMockState,
  flushPromises,
  mockProcessExit,
  runCli,
  spyOnLogger,
}
