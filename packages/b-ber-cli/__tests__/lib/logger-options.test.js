import { loggerArgvKeys, loggerOptions } from '../../src/lib/logger-options'

describe('loggerOptions', () => {
  it('sets nothing when no logger flag is given', () => {
    expect(loggerOptions(['build', 'epub'])).toEqual({})
  })

  it.each([
    [['--log-level=3'], 3],
    [['--log-level', '3'], 3],
    [['--quiet'], 0],
    [['--verbose'], 4],
    [['--debug'], 5],
  ])('reads %j as log level %d', (args, logLevel) => {
    expect(loggerOptions(['build', ...args])).toEqual({ logLevel })
  })

  it('lets --quiet, --verbose and --debug win over --log-level, in that order', () => {
    expect(loggerOptions(['--log-level=1', '--quiet'])).toEqual({ logLevel: 0 })
    expect(loggerOptions(['--quiet', '--verbose'])).toEqual({ logLevel: 4 })
    expect(loggerOptions(['--verbose', '--debug', '--quiet'])).toEqual({
      logLevel: 5,
    })
  })

  it('ignores a --log-level that is not a whole number', () => {
    expect(loggerOptions(['--log-level=loud'])).toEqual({})
    expect(loggerOptions(['--log-level'])).toEqual({})
  })

  it('reads --no-color and --summary', () => {
    expect(loggerOptions(['--no-color', '--summary'])).toEqual({
      boringOutput: true,
      summary: true,
    })
  })
})

describe('loggerArgvKeys', () => {
  it('names every key yargs makes of the logger flags', () => {
    expect([...loggerArgvKeys].sort()).toEqual(
      [
        'color',
        'debug',
        'log-level',
        'logLevel',
        'quiet',
        'summary',
        'verbose',
      ].sort()
    )
  })
})
