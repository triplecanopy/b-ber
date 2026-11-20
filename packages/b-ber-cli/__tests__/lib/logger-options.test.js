import {
  loggerOptions,
  splitLoggerFlags,
  withoutLoggerFlags,
} from '../../src/lib/logger-options'

// Where the output goes: a terminal, or a pipe or file
const tty = { isTTY: true }
const pipe = { isTTY: false }

describe('loggerOptions', () => {
  const { TERM } = process.env
  afterEach(() => {
    process.env.TERM = TERM
  })

  it('sets only the reporter when no logger flag is given', () => {
    expect(loggerOptions(['build', 'epub'], pipe)).toEqual({
      reporter: 'plain',
    })
  })

  it.each([
    [['--log-level=3'], 3],
    [['--log-level', '3'], 3],
    [['--quiet'], 0],
    [['--verbose'], 4],
    [['--debug'], 5],
  ])('reads %j as log level %d', (args, logLevel) => {
    expect(loggerOptions(['build', ...args], pipe)).toMatchObject({ logLevel })
  })

  it('lets --quiet, --verbose and --debug win over --log-level, in that order', () => {
    const level = (args) => loggerOptions(args, pipe).logLevel
    expect(level(['--log-level=1', '--quiet'])).toBe(0)
    expect(level(['--quiet', '--verbose'])).toBe(4)
    expect(level(['--verbose', '--debug', '--quiet'])).toBe(5)
  })

  it('ignores a --log-level that is not a whole number', () => {
    expect(loggerOptions(['--log-level=loud'], pipe)).not.toHaveProperty(
      'logLevel'
    )
    expect(loggerOptions(['--log-level'], pipe)).not.toHaveProperty('logLevel')
  })

  it('reads --no-color and --summary', () => {
    expect(loggerOptions(['--no-color', '--summary'], pipe)).toEqual({
      boringOutput: true,
      summary: true,
      reporter: 'plain',
    })
  })

  describe('the reporter', () => {
    it.each([
      ['a terminal', [], tty, 'progress'],
      ['a pipe', [], pipe, 'plain'],
      ['a terminal at --log-level=1', ['--log-level=1'], tty, 'progress'],
      ['a terminal at --log-level=3', ['--log-level=3'], tty, 'lines'],
      ['--verbose', ['--verbose'], tty, 'lines'],
      ['--debug', ['--debug'], pipe, 'lines'],
      ['--quiet', ['--quiet'], tty, 'lines'],
    ])('for %s is %s', (_, args, stdout, reporter) => {
      expect(loggerOptions(args, stdout).reporter).toBe(reporter)
    })

    it('is plain in a terminal that cannot move the cursor', () => {
      process.env.TERM = 'dumb'
      expect(loggerOptions([], tty).reporter).toBe('plain')
    })
  })
})

describe('splitLoggerFlags', () => {
  it('separates the logger’s flags from the rest, keeping each side’s order', () => {
    expect(
      splitLoggerFlags([
        'build',
        '--quiet',
        'epub',
        '--no-color',
        '--summary',
        '--verbose',
        '--debug',
        'web',
      ])
    ).toEqual({
      flags: ['--quiet', '--no-color', '--summary', '--verbose', '--debug'],
      rest: ['build', 'epub', 'web'],
    })
  })

  it.each([
    [['--log-level', '3', 'epub'], ['--log-level', '3'], ['epub']],
    [['--log-level=3', 'epub'], ['--log-level=3'], ['epub']],
    // Not a level, so the word is not the flag's
    [['--log-level', 'epub'], ['--log-level'], ['epub']],
    [['epub', '--log-level'], ['--log-level'], ['epub']],
  ])('splits %j', (args, flags, rest) => {
    expect(splitLoggerFlags(args)).toEqual({ flags, rest })
  })

  it('takes nothing after --', () => {
    expect(splitLoggerFlags(['build', '--', '--quiet'])).toEqual({
      flags: [],
      rest: ['build', '--', '--quiet'],
    })
  })

  it('leaves flags that are not the logger’s, and their values', () => {
    expect(
      withoutLoggerFlags(['build', '--config', 'c.yml', '--quiet-ish', 'epub'])
    ).toEqual(['build', '--config', 'c.yml', '--quiet-ish', 'epub'])
  })
})
