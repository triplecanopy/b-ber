import log from '@canopycanopycanopy/b-ber-logger'
import {
  exitCodeOnFailure,
  exitOnFailure,
  exitOnUncaughtFailure,
  exitWithFailure,
  fail,
} from '../../src/lib/exit'
import { mockProcessExit } from '../helpers/cli'

let exit
let output

beforeEach(() => {
  exit = mockProcessExit()
  output = []
  process.stdout.write.mockImplementation((chunk) => {
    output.push(String(chunk))
    return true
  })
  log.reset()
  log.configure({ logLevel: 2, boringOutput: true })
})

afterEach(() => jest.restoreAllMocks())

describe('exitWithFailure', () => {
  it('exits 1 after the closing line, without printing a reported error again', () => {
    const err = log.error('already printed')
    output = []

    exitWithFailure(err)

    expect(output.join('')).toBe('error exited with code 1\n')
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('prints an error the logger has not seen', () => {
    exitWithFailure(new TypeError('a bug'))

    expect(output.join('')).toBe('error a bug\nerror exited with code 1\n')
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('exits 1 at log level 0 too, printing nothing', () => {
    // Issue 744
    log.configure({ logLevel: 0 })
    exitWithFailure(new Error('quiet'))
    expect(output).toEqual([])
    expect(exit).toHaveBeenCalledWith(1)
  })
})

describe('exitOnFailure', () => {
  it('resolves with what the handler returns, without exiting', async () => {
    await expect(exitOnFailure(async (n) => n * 2)(21)).resolves.toBe(42)
    expect(exit).not.toHaveBeenCalled()
  })

  it('exits 1 when the handler throws', async () => {
    await exitOnFailure(() => {
      throw new Error('sync')
    })()
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('exits 1 when the handler rejects through log.error', async () => {
    await exitOnFailure(() =>
      Promise.reject(new Error('x')).catch((err) => {
        throw log.error(err)
      })
    )()
    expect(log.errors).toHaveLength(1)
    expect(exit).toHaveBeenCalledWith(1)
  })
})

describe('exitOnUncaughtFailure', () => {
  it('exits through exitWithFailure on an uncaught exception or rejection', () => {
    const on = jest.spyOn(process, 'on').mockImplementation(() => process)
    exitOnUncaughtFailure()
    expect(on).toHaveBeenCalledWith('uncaughtException', exitWithFailure)
    expect(on).toHaveBeenCalledWith('unhandledRejection', exitWithFailure)
  })
})

describe('exitCodeOnFailure', () => {
  let saved

  beforeEach(() => {
    saved = process.exitCode
    process.exitCode = undefined
  })

  afterEach(() => {
    process.exitCode = saved
    log.removeAllListeners('failure')
  })

  it('sets exit status 1 when the logger reports an error, and does not exit', () => {
    exitCodeOnFailure()
    log.error('reported, and the site carried on')

    expect(process.exitCode).toBe(1)
    expect(exit).not.toHaveBeenCalled()
  })

  it('sets it at log level 0 too', () => {
    log.configure({ logLevel: 0 })
    exitCodeOnFailure()
    log.error('quiet')

    expect(output).toEqual([])
    expect(process.exitCode).toBe(1)
  })

  it('leaves the exit status alone while nothing is reported', () => {
    exitCodeOnFailure()
    log.warn('only a warning')

    expect(process.exitCode).toBeUndefined()
  })
})

describe('fail', () => {
  const yargs = () => ({ showHelp: jest.fn() })

  it('shows the command’s help, then the usage error, and exits 1', () => {
    const y = yargs()
    fail('Missing required argument: name', undefined, y)

    expect(y.showHelp).toHaveBeenCalled()
    expect(output.join('')).toBe(
      'error Missing required argument: name\nerror exited with code 1\n'
    )
    expect(exit).toHaveBeenCalledWith(1)
  })

  it('reports an error without the help', () => {
    const y = yargs()
    fail('', new Error('builder threw'), y)

    expect(y.showHelp).not.toHaveBeenCalled()
    expect(log.errors.map((e) => e.message)).toEqual(['builder threw'])
    expect(exit).toHaveBeenCalledWith(1)
  })
})
