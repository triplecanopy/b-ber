import log from '../src'
import Logger, { floatFormat } from '../src/Logger'
import Timer from '../src/Timer'

// Everything the logger prints, one entry per write, ANSI codes and all
let output
const printed = () => output.join('')

const writeSpy = jest
  .spyOn(process.stdout, 'write')
  .mockImplementation((chunk) => {
    output.push(String(chunk))
    return true
  })

beforeEach(() => {
  output = []
  log.reset()
  log.configure({ logLevel: 2, boringOutput: true, summary: false })
  log.taskWarnings = 0
  log.taskErrors = 0
})

afterAll(() => writeSpy.mockRestore())

describe('configuration', () => {
  test('defaults to log level 2, colour on, no summary', () => {
    const logger = new Logger()
    expect(logger.logLevel).toBe(2)
    expect(logger.boringOutput).toBe(false)
    expect(logger.summary).toBe(false)
  })

  test('takes its options in the constructor', () => {
    const logger = new Logger({ logLevel: 4, boringOutput: true })
    expect(logger.logLevel).toBe(4)
    expect(logger.boringOutput).toBe(true)
  })

  test('configure applies only the options that are set', () => {
    const logger = new Logger({ logLevel: 3, boringOutput: true })
    logger.configure({ summary: true })
    expect(logger.logLevel).toBe(3)
    expect(logger.boringOutput).toBe(true)
    expect(logger.summary).toBe(true)
  })

  test('does not read process.argv', () => {
    const saved = process.argv
    process.argv = ['node', 'bber', '--quiet', '--no-color', '--log-level=5']
    try {
      const logger = new Logger()
      expect(logger.logLevel).toBe(2)
      expect(logger.boringOutput).toBe(false)
    } finally {
      process.argv = saved
    }
  })
})

describe('log.reset()', () => {
  test('clears the recorded errors and warnings', () => {
    log.warn('a warning')
    log.report('an error')
    log.reset()
    expect(log.errors).toHaveLength(0)
    expect(log.warnings).toHaveLength(0)
  })
})

describe('line format', () => {
  test.each([
    ['error', () => log.report('broken'), 'b-ber ERR! broken\n'],
    ['warn', () => log.warn('careful'), 'b-ber WARN careful\n'],
    ['notice', () => log.notice('hello'), 'b-ber info hello\n'],
  ])('%s has its own fixed-width label', (_level, fn, line) => {
    fn()
    expect(printed()).toBe(line)
  })

  test('info uses the info label, at --verbose', () => {
    log.configure({ logLevel: 4 })
    log.info('detail')
    expect(printed()).toMatch(/^\[[^\]]+\] b-ber info detail\n$/)
  })

  test('every line carries a timestamp from log level 3', () => {
    log.configure({ logLevel: 3 })
    log.notice('n')
    log.warn('w')
    log.report('e')
    const lines = printed().trim().split('\n')
    expect(lines).toHaveLength(3)
    for (const line of lines) {
      expect(line).toMatch(
        /^\[\d{4}-\d\d-\d\dT[^\]]+Z\] b-ber (info|WARN|ERR!) /
      )
    }
  })

  test('without colour, [highlighted] text keeps its brackets', () => {
    log.notice('Applying configuration option [%s]:[%s]', 'env', 'prod')
    expect(printed()).toBe(
      'b-ber info Applying configuration option [env]:[prod]\n'
    )
  })

  test('{N} is formatted as a byte count', () => {
    log.notice('copy [%s - {%d}]', 'a.jpg', 20480)
    expect(printed()).toBe('b-ber info copy [a.jpg - 20.48 Kb]\n')
  })

  test('supports util.format placeholders', () => {
    log.notice('%s and %d', 'one', 2)
    expect(printed()).toBe('b-ber info one and 2\n')
  })

  test('trims and indents the continuation lines of a message', () => {
    log.notice('first\n   second')
    expect(printed()).toBe('b-ber info first\n      second\n')
  })

  test('writes no ANSI codes with boringOutput', () => {
    log.report('e')
    log.warn('w')
    // biome-ignore lint/suspicious/noControlCharactersInRegex: matches an ANSI escape
    expect(printed()).not.toMatch(/\u001b\[/)
  })
})

describe('log.error()', () => {
  test('throws, so the code after it does not run', () => {
    let after = false
    expect(() => {
      log.error('something failed')
      after = true
    }).toThrow('something failed')
    expect(after).toBe(false)
  })

  test('never exits the process', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => {})
    expect(() => log.error('something failed')).toThrow()
    expect(exit).not.toHaveBeenCalled()
    exit.mockRestore()
  })

  test('throws an Error it is given as it is', () => {
    const err = new Error('real error')
    expect(() => log.error(err)).toThrow(err)
    expect(log.errors[0].message).toBe('real error')
  })

  test('formats a message with placeholders, as the other levels do', () => {
    expect(() => log.error('Image not found [%s]', 'a.jpg')).toThrow(
      'Image not found [a.jpg]'
    )
    expect(printed()).toBe('b-ber ERR! Image not found [a.jpg]\n')
  })

  test('the thrown message is plain text, whatever the colour setting', () => {
    log.configure({ boringOutput: false })
    expect(() => log.error('missing [x]')).toThrow(/^missing \[x\]$/)
  })

  test('rejects the chain when used as a promise catch handler', async () => {
    const err = new Error('task failed')
    await expect(Promise.reject(err).catch(log.error)).rejects.toBe(err)
    expect(log.errors).toHaveLength(1)
  })

  test('prints an error once, however many catch handlers it passes', async () => {
    const err = new Error('task failed')
    const chain = Promise.reject(err)
      .catch(log.error)
      .catch(log.error)
      .catch(log.error)
    await expect(chain).rejects.toBe(err)
    expect(log.errors).toHaveLength(1)
    expect(printed()).toBe('b-ber ERR! task failed\n')
  })

  test('records a structured entry and counts it for the task', () => {
    expect(() => log.error('something failed')).toThrow()
    expect(log.taskErrors).toBe(1)
    expect(log.errors[0]).toEqual({
      message: 'something failed',
      stack: expect.any(String),
      formatted: 'b-ber ERR! something failed',
    })
  })

  test('reports each element of an array as its own error', () => {
    expect(() => log.error([new Error('first'), 'second'])).toThrow(
      'first\nsecond'
    )
    expect(log.taskErrors).toBe(2)
    expect(printed()).toBe('b-ber ERR! first\nb-ber ERR! second\n')
  })

  test.each([0, 1])('still throws at log level %d', (logLevel) => {
    // Issue 744: the log level controls printing, never whether the error
    // stops the build
    log.configure({ logLevel })
    expect(() => log.error('silent')).toThrow('silent')
    expect(log.taskErrors).toBe(1)
  })

  test('prints nothing at log level 0', () => {
    log.configure({ logLevel: 0 })
    expect(() => log.error('silent')).toThrow()
    expect(printed()).toBe('')
  })

  test('prints the stack trace from log level 4', () => {
    log.configure({ logLevel: 4 })
    expect(() => log.error(new Error('with stack'))).toThrow()
    expect(printed()).toMatch(/ERR! with stack\n\s+at /)
  })
})

describe('log.report() / log.isReported()', () => {
  test('report prints and returns the error without throwing', () => {
    const err = log.report('not thrown')
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('not thrown')
    expect(printed()).toBe('b-ber ERR! not thrown\n')
  })

  test('isReported tells reported errors from others', () => {
    const reported = log.report(new Error('a'))
    expect(log.isReported(reported)).toBe(true)
    expect(log.isReported(new Error('b'))).toBe(false)
    expect(log.isReported('a string')).toBe(false)
    expect(log.isReported(undefined)).toBe(false)
  })

  test('reporting an error again returns it without printing it again', () => {
    const err = log.report('once')
    expect(log.report(err)).toBe(err)
    expect(log.errors).toHaveLength(1)
  })

  test('what log.error throws is reported', () => {
    try {
      log.error('thrown')
    } catch (err) {
      expect(log.isReported(err)).toBe(true)
    }
  })
})

describe('log.warn()', () => {
  test('records a structured entry and counts it for the task', () => {
    log.warn('test warning')
    expect(log.taskWarnings).toBe(1)
    expect(log.warnings[0]).toEqual({
      message: 'test warning',
      stack: expect.any(String),
      formatted: 'b-ber WARN test warning',
    })
  })

  test('does nothing below log level 2', () => {
    log.configure({ logLevel: 1 })
    log.warn('silent warning')
    expect(log.taskWarnings).toBe(0)
    expect(printed()).toBe('')
  })

  test('uses the message of an Error', () => {
    log.warn(new Error('err message'))
    expect(log.warnings[0].message).toBe('err message')
  })

  test('prints the stack trace from log level 4', () => {
    log.configure({ logLevel: 4 })
    log.warn('w')
    expect(printed()).toMatch(/WARN w\n\s+at /)
  })
})

describe('log.notice()', () => {
  test('prints at log level 1', () => {
    log.configure({ logLevel: 1 })
    log.notice('shown')
    expect(printed()).toBe('b-ber info shown\n')
  })

  test('prints nothing at log level 0', () => {
    log.configure({ logLevel: 0 })
    log.notice('quiet')
    expect(printed()).toBe('')
  })
})

describe('log.info()', () => {
  test('prints nothing below log level 4', () => {
    log.configure({ logLevel: 3 })
    log.info('silent info')
    expect(printed()).toBe('')
  })

  test('prints its stack trace at log level 5', () => {
    log.configure({ logLevel: 5 })
    log.info('traced')
    expect(printed()).toMatch(/info traced\n\s+at /)
  })
})

describe('the other methods', () => {
  test('debug and trace are no-ops', () => {
    log.configure({ logLevel: 5 })
    log.debug('anything')
    log.trace('anything')
    expect(printed()).toBe('')
  })

  test('inspect prints the value in full', () => {
    log.inspect({ foo: { bar: { baz: 1 } } })
    expect(printed()).toContain('baz: 1')
  })

  test('printFailure prints the exit code as an error line', () => {
    log.printFailure(1)
    expect(printed()).toBe('b-ber ERR! exited with code 1\n')
  })

  test('printFailure is silent at log level 0', () => {
    log.configure({ logLevel: 0 })
    log.printFailure(1)
    expect(printed()).toBe('')
  })

  test('printVersion prints a notice', () => {
    log.printVersion('1.2.3')
    expect(printed()).toBe('b-ber info version 1.2.3\n')
  })

  test.each([
    [['a', 'b'], 'b-ber info Preparing to run 2 tasks\n'],
    [['a'], 'b-ber info Preparing to run 1 task\n'],
  ])('registerSequence announces %j', (sequence, line) => {
    log.registerSequence({}, 'build', sequence)
    expect(printed()).toBe(line)
  })

  test('registerSequence prints nothing at log level 0', () => {
    log.configure({ logLevel: 0 })
    log.registerSequence({}, 'build', ['a'])
    expect(printed()).toBe('')
  })
})

describe('build progress events', () => {
  const state = {
    config: { theme: 'serif', nested: { env: 'dev' } },
    metadata: { json: () => [{ term: 'title', value: 'A Book' }] },
    toc: [{ title: 'One', name: 'one', nodes: [{ name: 'two' }] }],
  }

  test('start emits begin, which resets the task counts', () => {
    const begin = jest.fn()
    log.on('begin', begin)
    log.taskWarnings = 5
    log.taskErrors = 3

    log.notify('start', 'render')

    expect(begin).toHaveBeenCalledWith({ task: 'render' })
    expect(log.task).toBe('render')
    expect(log.taskWarnings).toBe(0)
    expect(log.taskErrors).toBe(0)
    log.off('begin', begin)
  })

  test('stop emits end with the task time', () => {
    const end = jest.fn()
    log.on('end', end)
    log.notify('start', 'render')
    log.notify('stop', 'render')

    expect(end).toHaveBeenCalledWith({
      task: 'render',
      taskTime: expect.objectContaining({
        taskName: 'render',
        totalMs: expect.stringMatching(/^\d+\.\d{3}ms$/),
      }),
    })
    log.off('end', end)
  })

  test('a finished task prints a line from log level 3', () => {
    log.configure({ logLevel: 3 })
    log.notify('start', 'render')
    log.notify('stop', 'render')
    expect(printed()).toMatch(/b-ber info render done \(\d+\.\d{3}ms\)\n$/)
  })

  test('a finished task prints nothing below log level 3', () => {
    log.notify('start', 'render')
    log.notify('stop', 'render')
    expect(printed()).toBe('')
  })

  test('done emits done with the state and run time, and prints success', () => {
    const done = jest.fn()
    log.on('done', done)
    log.notify('done', { state })

    expect(done).toHaveBeenCalledWith(
      expect.objectContaining({
        state,
        taskTimes: expect.any(Array),
        sequenceEnd: expect.stringMatching(/ms$/),
      })
    )
    expect(printed()).toBe('b-ber info Build succeeded\n')
    log.off('done', done)
  })

  test('done prints nothing at log level 0', () => {
    log.configure({ logLevel: 0 })
    log.notify('done', { state })
    expect(printed()).toBe('')
  })

  test('done prints the summary when it is enabled', () => {
    log.configure({ summary: true })
    log.notify('done', { state })
    const text = printed()
    for (const heading of [
      'Stats',
      'Configuration',
      'Metadata',
      'Navigation',
    ]) {
      expect(text).toContain(`b-ber info ${heading}\n`)
    }
    expect(text).toContain('b-ber info theme: serif\n')
    expect(text).toContain('b-ber info   env: dev\n')
    expect(text).toContain('b-ber info title: A Book\n')
    expect(text).toContain('b-ber info One: one\n')
    expect(text).toContain('b-ber info   [no title]: two\n')
  })
})

describe('floatFormat', () => {
  test.each([
    [1, '1.00 B'],
    [100, '100.00 B'],
    [1024, '1.02 Kb'],
    [1500000, '1.50 Mb'],
    [1000000000, '1.00 Gb'],
    [5000000000000, '5000.00 Gb'],
  ])('formats %d as %s', (n, text) => {
    expect(floatFormat(n)).toBe(text)
  })
})

describe('Timer', () => {
  test('times each task from start to stop', () => {
    const timer = new Timer()
    timer.start()
    const time = timer.stop('t')
    expect(time.taskName).toBe('t')
    expect(time.totalMs).toMatch(/^\d+\.\d{3}ms$/)
  })

  test('done lists every task timed', () => {
    const timer = new Timer()
    timer.start()
    timer.stop('a')
    timer.start()
    timer.stop('b')
    const run = timer.done()
    expect(run.taskTimes.map((t) => t.taskName)).toEqual(['a', 'b'])
    expect(run.formattedStartDate).toEqual(expect.any(String))
    expect(run.formattedEndDate).toEqual(expect.any(String))
  })
})
