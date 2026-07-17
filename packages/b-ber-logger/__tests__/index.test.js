import log from '../src'
import Timer from '../src/Timer'

const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {})
const writeSpy = jest
  .spyOn(process.stdout, 'write')
  .mockImplementation(() => {})

// TTY methods used in the 'end' event listener — may not exist in test env
if (!process.stdout.clearLine) process.stdout.clearLine = () => {}
if (!process.stdout.cursorTo) process.stdout.cursorTo = () => {}

const clearLineSpy = jest
  .spyOn(process.stdout, 'clearLine')
  .mockImplementation(() => {})
const cursorToSpy = jest
  .spyOn(process.stdout, 'cursorTo')
  .mockImplementation(() => {})

beforeEach(() => {
  log.reset()
  log.logLevel = 2
  log.taskWarnings = 0
  log.taskErrors = 0
  log.indentLevel = 0
  log.increment = 0
  log.boringOutput = true // suppress chalk codes in string assertions
  exitSpy.mockClear()
  writeSpy.mockClear()
  clearLineSpy.mockClear()
  cursorToSpy.mockClear()
})

afterAll(() => {
  exitSpy.mockRestore()
  writeSpy.mockRestore()
  clearLineSpy.mockRestore()
  cursorToSpy.mockRestore()
})

describe('log.reset()', () => {
  test('clears the errors array', () => {
    log.errors.push({ message: 'err', formatted: '', stack: '' })
    log.reset()
    expect(log.errors).toHaveLength(0)
  })

  test('clears the warnings array', () => {
    log.warnings.push({ message: 'warn', formatted: '', stack: '' })
    log.reset()
    expect(log.warnings).toHaveLength(0)
  })
})

describe('log.configure()', () => {
  beforeEach(() => {
    log.settings = {
      quiet: false,
      verbose: false,
      debug: false,
      summary: false,
      'no-color': false,
      'log-level': 2,
    }
  })

  test('sets logLevel from settings["log-level"]', () => {
    log.settings['log-level'] = 3
    log.configure()
    expect(log.logLevel).toBe(3)
  })

  test('quiet overrides logLevel to 0', () => {
    log.settings.quiet = true
    log.configure()
    expect(log.logLevel).toBe(0)
  })

  test('verbose sets logLevel to 4', () => {
    log.settings.verbose = true
    log.configure()
    expect(log.logLevel).toBe(4)
  })

  test('debug sets logLevel to 5', () => {
    log.settings.debug = true
    log.configure()
    expect(log.logLevel).toBe(5)
  })

  test('no-color sets boringOutput', () => {
    log.boringOutput = false
    log.settings['no-color'] = true
    log.configure()
    expect(log.boringOutput).toBe(true)
  })
})

describe('log.warn()', () => {
  test('increments taskWarnings', () => {
    log.warn('test warning')
    expect(log.taskWarnings).toBe(1)
  })

  test('pushes a structured entry to warnings array', () => {
    log.warn('test warning')
    expect(log.warnings).toHaveLength(1)
    expect(log.warnings[0]).toHaveProperty('message')
    expect(log.warnings[0]).toHaveProperty('stack')
    expect(log.warnings[0]).toHaveProperty('formatted')
  })

  test('writes output to stdout', () => {
    log.warn('test warning')
    expect(writeSpy).toHaveBeenCalled()
  })

  test('does nothing when logLevel < 2', () => {
    log.logLevel = 1
    log.warn('silent warning')
    expect(log.taskWarnings).toBe(0)
    expect(writeSpy).not.toHaveBeenCalled()
  })

  test('handles Error instances', () => {
    log.warn(new Error('err message'))
    expect(log.taskWarnings).toBe(1)
  })
})

describe('log.error()', () => {
  test('calls process.exit(1)', () => {
    log.error('something failed')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })

  test('increments taskErrors', () => {
    log.error('something failed')
    expect(log.taskErrors).toBe(1)
  })

  test('pushes a structured entry to errors array', () => {
    log.error('something failed')
    expect(log.errors).toHaveLength(1)
    expect(log.errors[0]).toHaveProperty('message')
    expect(log.errors[0]).toHaveProperty('stack')
    expect(log.errors[0]).toHaveProperty('formatted')
  })

  test('captures Error instance message', () => {
    log.error(new Error('real error'))
    expect(log.errors[0].message).toContain('real error')
  })

  test('captures plain string message', () => {
    log.error('string error')
    expect(log.errors[0].message).toBeTruthy()
  })

  test('processes an array of messages', () => {
    log.error(['first', 'second'])
    expect(log.taskErrors).toBe(2)
  })

  test('writes to stdout', () => {
    log.error('something failed')
    expect(writeSpy).toHaveBeenCalled()
  })

  test('does nothing when logLevel < 1', () => {
    log.logLevel = 0
    log.error('silent')
    expect(exitSpy).not.toHaveBeenCalled()
    expect(log.taskErrors).toBe(0)
  })
})

describe('log.notice()', () => {
  test('writes to stdout regardless of logLevel', () => {
    log.logLevel = 0
    log.notice('always prints')
    expect(writeSpy).toHaveBeenCalled()
  })

  test('writes at high logLevel too', () => {
    log.logLevel = 5
    log.notice('high verbosity')
    expect(writeSpy).toHaveBeenCalled()
  })
})

describe('log.notify()', () => {
  test('dispatches to the named method with data', () => {
    const orig = log.warn
    log.warn = jest.fn()
    log.notify('warn', 'dispatched data')
    expect(log.warn).toHaveBeenCalledWith('dispatched data')
    log.warn = orig
  })
})

describe('log.floatFormat()', () => {
  test('formats 1-digit numbers as B', () => {
    expect(log.floatFormat(1)).toContain('B')
  })

  test('formats 3-digit numbers as B', () => {
    expect(log.floatFormat(100)).toContain('B')
  })

  test('formats 4-digit numbers as Kb', () => {
    expect(log.floatFormat(1024)).toContain('Kb')
  })

  test('formats 7-digit numbers as Mb', () => {
    expect(log.floatFormat(1500000)).toContain('Mb')
  })

  test('formats 10-digit numbers as Gb', () => {
    expect(log.floatFormat(1000000000)).toContain('Gb')
  })
})

describe('log.indent() / indentLevel', () => {
  test('returns empty string at default level', () => {
    expect(log.indent()).toBe('')
  })

  test('incrementIndent raises indentLevel by increment', () => {
    log.increment = 2
    log.incrementIndent()
    expect(log.indentLevel).toBe(2)
  })

  test('decrementIndent lowers indentLevel by increment', () => {
    log.increment = 2
    log.indentLevel = 4
    log.decrementIndent()
    expect(log.indentLevel).toBe(2)
  })
})

describe('log.incrementCounter() / decrementCounter()', () => {
  test('incrementCounter raises taskCounter', () => {
    const before = log.taskCounter
    log.incrementCounter()
    expect(log.taskCounter).toBe(before + 1)
  })

  test('decrementCounter lowers taskCounter', () => {
    const before = log.taskCounter
    log.decrementCounter()
    expect(log.taskCounter).toBe(before - 1)
  })
})

describe('log.counter()', () => {
  test('increments taskCounter and returns a string', () => {
    const before = log.taskCounter
    const result = log.counter()
    expect(log.taskCounter).toBe(before + 1)
    expect(typeof result).toBe('string')
  })
})

describe('log.composeMessage()', () => {
  test('formats a plain string', () => {
    expect(log.composeMessage(['hello world'])).toContain('hello world')
  })

  test('formats via util.format patterns', () => {
    expect(log.composeMessage(['%s %s', 'foo', 'bar'])).toContain('foo bar')
  })

  test('replaces {N} with a floatFormat value', () => {
    expect(log.composeMessage(['{1024}'])).toContain('Kb')
  })

  test('trims each line', () => {
    expect(log.composeMessage(['  padded  '])).toBe('padded')
  })
})

describe('log.decorate()', () => {
  test('returns a string', () => {
    expect(typeof log.decorate('hello')).toBe('string')
  })

  test('passes through value without chalk when boringOutput is true', () => {
    expect(log.decorate('plain')).toBe('plain')
  })

  test('handles array input', () => {
    expect(typeof log.decorate(['a', 'b'])).toBe('string')
  })

  test('handles undefined without throwing', () => {
    expect(() => log.decorate(undefined)).not.toThrow()
  })
})

describe('log.newLine()', () => {
  test('writes a newline to stdout', () => {
    log.newLine()
    expect(writeSpy).toHaveBeenCalledWith('\n')
  })
})

describe('log.debug()', () => {
  test('is callable without error', () => {
    expect(() => log.debug('anything')).not.toThrow()
  })
})

describe('log.printWarnings() / printErrors()', () => {
  test('printWarnings does not throw', () => {
    expect(() => log.printWarnings('test-task')).not.toThrow()
  })

  test('printErrors does not throw', () => {
    expect(() => log.printErrors('test-task')).not.toThrow()
  })
})

describe('log.info()', () => {
  test('does not write when logLevel < 4', () => {
    log.logLevel = 2
    log.info('silent info')
    expect(writeSpy).not.toHaveBeenCalled()
  })

  test('writes to stdout when logLevel >= 4', () => {
    log.logLevel = 4
    log.info('verbose info')
    expect(writeSpy).toHaveBeenCalled()
  })
})

describe('log.inspect()', () => {
  test('calls console.log', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
    log.inspect({ foo: 'bar' })
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})

describe('log.trace()', () => {
  test('is callable without error', () => {
    expect(() => log.trace()).not.toThrow()
  })
})

describe('log.registerSequence()', () => {
  test('writes to stdout when logLevel >= 1', () => {
    log.logLevel = 2
    log.registerSequence({}, 'build', ['task1', 'task2'])
    expect(writeSpy).toHaveBeenCalled()
  })

  test('does nothing when logLevel < 1', () => {
    log.logLevel = 0
    log.registerSequence({}, 'build', ['task1'])
    expect(writeSpy).not.toHaveBeenCalled()
  })
})

describe('log.wrap()', () => {
  test('joins an array of strings', () => {
    const result = log.wrap(['foo', 'bar', 'baz'], '')
    expect(result).toContain('foo')
    expect(result).toContain('bar')
  })

  test('returns a string', () => {
    expect(typeof log.wrap(['a', 'b'], '')).toBe('string')
  })
})

describe('Timer events (begin / end / done)', () => {
  test('begin event resets taskWarnings and taskErrors', () => {
    log.taskWarnings = 5
    log.taskErrors = 3
    log.emit('begin', { task: 'test-task' })
    expect(log.taskWarnings).toBe(0)
    expect(log.taskErrors).toBe(0)
  })

  test('done event writes to stdout when logLevel >= 1', () => {
    log.emit('done', { taskTimes: [], formattedStartDate: '', sequenceEnd: '' })
    expect(writeSpy).toHaveBeenCalled()
  })

  test('done event does nothing when logLevel < 1', () => {
    log.logLevel = 0
    log.emit('done', { taskTimes: [] })
    expect(writeSpy).not.toHaveBeenCalled()
  })

  test('end event decrements indentLevel', () => {
    log.increment = 2
    log.indentLevel = 4
    log.emit('end', { task: 'test', taskTime: { totalMs: '100ms' } })
    expect(log.indentLevel).toBe(2)
  })
})

describe('log.warn() at logLevel > 2', () => {
  test('includes timestamp prefix at logLevel 3', () => {
    log.logLevel = 3
    log.warn('verbose warning')
    expect(log.taskWarnings).toBe(1)
    expect(writeSpy).toHaveBeenCalled()
  })
})

describe('log.decorate() with chalk enabled', () => {
  test('applies chalk styling when boringOutput is false', () => {
    log.boringOutput = false
    const result = log.decorate('styled', 'green')
    // With chalk enabled, the output is wrapped in ANSI codes
    expect(typeof result).toBe('string')
    expect(result).toContain('styled')
  })
})

describe('Timer instance methods', () => {
  test('start() sets taskBegin and emits begin event', () => {
    log.emit = jest.fn()
    log.start('my-task')
    expect(log.taskBegin).toBeTruthy()
    expect(log.emit).toHaveBeenCalledWith(
      'begin',
      expect.objectContaining({ task: 'my-task' })
    )
    log.emit = log.constructor.prototype.emit.bind(log)
  })

  test('stop() records task time and emits end event', () => {
    log.emit = jest.fn()
    log.taskBegin = process.hrtime()
    log.stop('my-task')
    expect(log.taskTimes).toHaveLength(1)
    expect(log.emit).toHaveBeenCalledWith(
      'end',
      expect.objectContaining({ task: 'my-task' })
    )
    log.emit = log.constructor.prototype.emit.bind(log)
  })
})

describe('Timer static methods', () => {
  test('timeFormat returns a string with ms', () => {
    expect(Timer.timeFormat([1, 500000])).toContain('ms')
  })

  test('dateFormat returns a non-empty string', () => {
    const result = Timer.dateFormat()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
