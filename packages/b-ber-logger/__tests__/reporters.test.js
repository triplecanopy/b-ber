/**
 * @jest-environment node
 */

// node: the spinner's timer is unref'd, and jsdom's timers have no `unref`

import { formatDuration } from '../src/format'
import Logger from '../src/Logger'
import { CompactReporter } from '../src/reporters'

// The redrawing line's prefix: back to the start of the line, and clear it
const CLEAR = '\r\x1b[2K'

// A stream that records what is written to it. `columns` as a terminal has
const fakeStream = (columns = 100) => {
  const stream = {
    chunks: [],
    columns,
    write: jest.fn((chunk) => {
      stream.chunks.push(String(chunk))
      return true
    }),
    text: () => stream.chunks.join(''),
  }
  return stream
}

// What a terminal would show once the output had been written: `\r` and
// clear-line erase the line being drawn
const screen = (text) => {
  const lines = []
  let line = ''
  for (const part of text.replaceAll(CLEAR, '\0').split(/(\n|\0)/)) {
    if (part === '\n') {
      lines.push(line)
      line = ''
    } else if (part === '\0') line = ''
    else line += part
  }
  if (line) lines.push(line)
  return lines
}

const PLAN = [{ name: 'web', tasks: ['clean', 'render', 'web'] }]
const TWO = [
  { name: 'epub', tasks: ['clean', 'epub'] },
  { name: 'web', tasks: ['clean', 'web'] },
]
const STATE = {
  config: { theme: 'serif' },
  metadata: { json: () => [{ term: 'title', value: 'A Book' }] },
  toc: [{ title: 'One', name: 'one' }],
}

// Runs the tasks of each format in `plan` as b-ber-tasks' build does,
// calling `during(format, task)` inside each
const build = (log, plan, during = () => {}) => {
  log.registerSequence(plan)
  for (const { name, tasks } of plan) {
    for (const task of tasks) {
      log.notify('start', task)
      during(name, task)
      log.notify('stop', task)
    }
    log.notify('done', { state: { ...STATE, build: name } })
  }
}

let log
let reporter
let out
let err

// The logger's own default reporter writes to stdout: keep it quiet
let stdoutSpy
beforeAll(() => {
  stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
})
afterAll(() => stdoutSpy.mockRestore())

const setup = ({ live = false, columns, ...options } = {}) => {
  log = new Logger({ logLevel: 2, boringOutput: true, ...options })
  out = fakeStream(columns)
  err = fakeStream(columns)
  reporter = new CompactReporter(log, live, out, [out, err])
}

afterEach(() => {
  reporter?.detach()
  jest.useRealTimers()
})

describe('plain (CompactReporter, not live)', () => {
  test('holds warnings back, groups them, and ends with the result', () => {
    setup()
    build(log, PLAN, (_, task) => {
      if (task === 'render') {
        log.warn('[a] is deprecated')
        log.warn('[a] is deprecated')
        log.warn('another')
      }
    })

    expect(screen(out.text())).toEqual([
      'warn  [a] is deprecated ×2',
      'warn  another',
      expect.stringMatching(/^✓ Built web in \d+ms · 3 warnings$/),
    ])
  })

  test('never moves the cursor', () => {
    setup()
    build(log, TWO, () => log.warn('w'))
    expect(out.text()).not.toContain('\r')
    expect(out.text()).not.toContain('\x1b')
  })

  test('prints errors and notices as they happen', () => {
    setup()
    build(log, PLAN, (_, task) => {
      if (task === 'clean') log.notice('Applying [x]')
      if (task === 'render') log.warn('later')
      if (task === 'web') log.error('broken')
    })

    expect(screen(out.text())).toEqual([
      'info  Applying [x]',
      'error broken',
      'warn  later',
      expect.stringMatching(/^✓ Built web in \d+ms · 1 warning$/),
    ])
  })

  test('prints a line per format, then the whole build', () => {
    setup()
    build(log, TWO)

    expect(screen(out.text())).toEqual([
      expect.stringMatching(/^✓ epub \d+ms$/),
      expect.stringMatching(/^✓ web \d+ms$/),
      expect.stringMatching(/^✓ Built 2 formats in \d+ms$/),
    ])
  })

  test('counts a warning repeated in every format once, with the total', () => {
    setup()
    build(log, TWO, (_, task) => task === 'clean' && log.warn('same'))
    expect(screen(out.text())).toContain('warn  same ×2')
  })

  test('puts the count of a multi-line warning on its first line', () => {
    setup()
    build(log, PLAN, (_, task) => {
      if (task === 'clean') {
        log.warn('first line\nsecond line')
        log.warn('first line\nsecond line')
      }
    })

    expect(screen(out.text()).slice(0, 2)).toEqual([
      'warn  first line ×2',
      '      second line',
    ])
  })

  test('says where a failed build stopped, after its warnings', () => {
    setup()
    log.registerSequence(PLAN)
    log.notify('start', 'clean')
    log.notify('stop', 'clean')
    log.notify('start', 'render')
    log.warn('w')
    log.error('Image not found')
    log.printFailure(1)

    expect(screen(out.text())).toEqual([
      'error Image not found',
      'warn  w',
      expect.stringMatching(
        /^✗ Build failed at render \(2\/3\) after \d+ms · 1 warning$/
      ),
    ])
  })

  test('names the format a multi-format build failed in', () => {
    setup()
    log.registerSequence(TWO)
    log.notify('start', 'clean')
    log.printFailure(1)

    expect(screen(out.text()).at(-1)).toMatch(
      /^✗ Build failed at epub › clean \(1\/2\) after \d+ms$/
    )
  })

  test('prints messages as they happen when no build is running', () => {
    setup()
    log.warn('not a build')
    log.printFailure(1)

    expect(screen(out.text())).toEqual([
      'warn  not a build',
      'error exited with code 1',
    ])
  })

  test('reports a rebuild that registered no sequence (bber serve)', () => {
    setup()
    log.notify('start', 'render')
    log.notify('stop', 'render')
    log.notify('done', { state: { ...STATE, build: 'web' } })

    expect(screen(out.text())).toEqual([
      expect.stringMatching(/^✓ Built web in \d+ms$/),
    ])
  })

  test('at log level 1 shows errors and the result, without warnings', () => {
    setup({ logLevel: 1 })
    build(log, PLAN, () => log.warn('w'))
    expect(screen(out.text())).toEqual([
      expect.stringMatching(/^✓ Built web in \d+ms$/),
    ])
  })

  test('prints nothing at log level 0', () => {
    setup({ logLevel: 0 })
    build(log, PLAN, () => {
      log.warn('w')
      log.error('e')
    })
    log.printFailure(1)
    expect(out.text()).toBe('')
  })

  test('prints the summary after the result when it is enabled', () => {
    setup({ summary: true })
    build(log, PLAN)

    const lines = screen(out.text())
    expect(lines[0]).toMatch(/^✓ Built web/)
    expect(lines).toContain('info  Stats')
    expect(lines).toContain('info  title: A Book')
  })
})

describe('progress (CompactReporter, live)', () => {
  test('draws a line for each task as it begins', () => {
    setup({ live: true })
    log.registerSequence(PLAN)
    log.notify('start', 'clean')
    log.notify('stop', 'clean')
    log.notify('start', 'render')

    expect(out.chunks).toEqual([
      `${CLEAR}⠋ [1/3] clean`,
      `${CLEAR}⠋ [2/3] render`,
    ])
  })

  test('pads the counter so the line does not shift', () => {
    setup({ live: true })
    log.registerSequence([{ name: 'web', tasks: new Array(12).fill('t') }])
    log.notify('start', 't')
    expect(out.text()).toBe(`${CLEAR}⠋ [ 1/12] t`)
  })

  test('names the format when the build runs more than one', () => {
    setup({ live: true })
    log.registerSequence(TWO)
    log.notify('start', 'clean')
    expect(out.text()).toBe(`${CLEAR}⠋ [1/2] epub clean`)
  })

  test('prints a line above the redrawing one, and redraws it', () => {
    setup({ live: true })
    log.registerSequence(PLAN)
    log.notify('start', 'clean')
    log.error('broken')

    expect(out.chunks.slice(1)).toEqual([
      CLEAR,
      'error broken\n',
      `${CLEAR}⠋ [1/3] clean`,
    ])
  })

  test('ends with the result, and the line gone', () => {
    setup({ live: true })
    build(log, PLAN)

    expect(screen(out.text())).toEqual([
      expect.stringMatching(/^✓ Built web in \d+ms$/),
    ])
  })

  test('leaves out what does not fit in the terminal', () => {
    setup({ live: true, columns: 20 })
    log.registerSequence(TWO)
    log.notify('start', 'a-long-task-name')
    expect(out.text()).toBe(`${CLEAR}⠋ [1/2] epub`)
  })

  test('turns the spinner on a timer, and stops it at the end', () => {
    jest.useFakeTimers()
    setup({ live: true })
    log.registerSequence(PLAN)
    log.notify('start', 'clean')
    jest.advanceTimersByTime(80)
    expect(out.chunks.at(-1)).toBe(`${CLEAR}⠙ [1/3] clean`)

    log.notify('stop', 'clean')
    log.notify('done', { state: STATE })
    expect(jest.getTimerCount()).toBe(0)
  })

  describe('output it does not write', () => {
    test('is written above the line, which is redrawn after it', () => {
      setup({ live: true })
      log.registerSequence(PLAN)
      log.notify('start', 'clean')
      err.write('Validating\n')

      expect(out.chunks.slice(1)).toEqual([CLEAR, `${CLEAR}⠋ [1/3] clean`])
      expect(err.chunks).toEqual(['Validating\n'])
    })

    test('is not drawn over while it has not ended its line', () => {
      jest.useFakeTimers()
      setup({ live: true })
      log.registerSequence(PLAN)
      log.notify('start', 'clean')
      out.write('Checking...')
      jest.advanceTimersByTime(800)
      log.warn('held, so nothing is printed')
      expect(out.text()).toBe(`${CLEAR}⠋ [1/3] clean${CLEAR}Checking...`)

      out.write(' done\n')
      const last = out.chunks.at(-1)
      expect(last.startsWith(CLEAR)).toBe(true)
      expect(last.endsWith(' [1/3] clean')).toBe(true)
    })

    test('a line it prints first finishes the line left open', () => {
      setup({ live: true })
      log.registerSequence(PLAN)
      log.notify('start', 'clean')
      out.write('Checking...')
      log.error('broken')
      expect(screen(out.text())).toEqual([
        'Checking...',
        'error broken',
        '⠋ [1/3] clean',
      ])
    })

    test('goes straight through once the build has finished', () => {
      setup({ live: true })
      const write = err.write
      build(log, PLAN)
      expect(err.write).toBe(write)
    })
  })
})

describe('log.configure({ reporter })', () => {
  test('replaces the reporter, which stops listening', () => {
    const logger = new Logger({ boringOutput: true })
    const before = logger.listenerCount('message')
    logger.configure({ reporter: 'plain' })
    logger.configure({ reporter: 'progress' })
    logger.configure({ reporter: 'lines' })
    expect(logger.listenerCount('message')).toBe(before)
  })
})

describe('formatDuration', () => {
  test.each([
    [12.4, '12ms'],
    [999, '999ms'],
    [4210, '4.2s'],
    [59_940, '59.9s'],
    [72_000, '1m 12s'],
  ])('%d ms is %s', (ms, text) => {
    expect(formatDuration(ms)).toBe(text)
  })
})
