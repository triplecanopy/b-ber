/**
 * @jest-environment node
 */

// The target builds (TASK-165): each a plain async function that runs its
// steps in order. They replaced b-ber-shapes-sequences' lists and `serialize`.
// Every task is mocked; each task's own test file covers what it does.

import { getTarget } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'

jest.mock('@canopycanopycanopy/b-ber-logger')

const TASKS = [
  'clean',
  'container',
  'cover',
  'sass',
  'copy',
  'scripts',
  'render',
  'loi',
  'footnotes',
  'inject',
  'opf',
  'epub',
  'mobi',
  'pdf',
  'web',
  'sample',
  'reader',
  'xml',
]

// Each task records its name when it runs, and resolves to whatever a later
// task may need from it
const mockCalls = []
const mockOutputs = {
  render: { figures: [], footnotes: [], guide: [], remoteAssets: [] },
  loi: { pages: [], guide: [] },
  footnotes: undefined,
}
for (const name of TASKS) {
  jest.doMock(`../src/${name}`, () => ({
    __esModule: true,
    default: jest.fn(async () => {
      mockCalls.push(name)
      return mockOutputs[name]
    }),
  }))
}
jest.mock('../src/mobi/mobi-css', () => ({
  __esModule: true,
  default: jest.fn(async () => {
    mockCalls.push('mobiCSS')
  }),
}))

// Required once the tasks are mocked, which doMock does not hoist
const { build, targetNames, targetSteps } = require('../src/targets')

const context = (name) => ({
  target: getTarget(name),
  config: { the: 'config' },
  project: { metadata: { the: 'metadata' } },
  settings: { toc: ['the toc'] },
})

// The step names the logger's start events carried, in order
const started = () =>
  log.notify.mock.calls.filter(([e]) => e === 'start').map(([, n]) => n)

beforeEach(() => {
  mockCalls.length = 0
  jest.clearAllMocks()
  log.error.mockImplementation((err) => err)
})

describe('target builds', () => {
  test('every target, in the order `bber build` builds them', () => {
    expect(targetNames).toEqual([
      'epub',
      'mobi',
      'pdf',
      'web',
      'sample',
      'reader',
      'xml',
    ])
  })

  test.each(targetNames)(
    '%s runs the steps it lists, in order',
    async (name) => {
      await build(context(name))

      expect(started()).toEqual([...targetSteps(name)])
      expect(mockCalls).toEqual([...targetSteps(name)])
    }
  )

  test.each([
    ['epub', 'epub'],
    ['mobi', 'mobi'],
    ['pdf', 'pdf'],
    ['web', 'web'],
    ['sample', 'sample'],
    ['reader', 'reader'],
    ['xml', 'xml'],
  ])('%s ends with its own packaging step, %s', (name, last) => {
    expect(targetSteps(name).at(-1)).toBe(last)
  })

  test('mobi strips its stylesheets before packaging', () => {
    expect(targetSteps('mobi').slice(-2)).toEqual(['mobiCSS', 'mobi'])
  })

  test('each step stops before the next starts', async () => {
    await build(context('epub'))

    const events = log.notify.mock.calls
      .filter(([e]) => e !== 'done')
      .map(([e, n]) => `${e} ${n}`)
    const expected = targetSteps('epub').flatMap((n) => [
      `start ${n}`,
      `stop ${n}`,
    ])
    expect(events).toEqual(expected)
  })

  test('announces the end of the build with what the summary prints', async () => {
    const ctx = context('web')
    await build(ctx)

    expect(log.notify).toHaveBeenLastCalledWith('done', {
      state: {
        build: 'web',
        config: ctx.config,
        metadata: ctx.project.metadata,
        toc: ctx.settings.toc,
      },
    })
  })

  test('stops at a failing step, reports it and rejects with it', async () => {
    const error = new Error('sass failed')
    const { default: sass } = require('../src/sass')
    sass.mockImplementationOnce(async () => {
      throw error
    })

    await expect(build(context('epub'))).rejects.toBe(error)
    expect(log.error).toHaveBeenCalledWith(error)
    expect(mockCalls).toEqual(['clean', 'container', 'cover'])
    expect(started().at(-1)).toBe('sass')
    expect(log.notify).not.toHaveBeenCalledWith('stop', 'sass')
    expect(log.notify).not.toHaveBeenCalledWith('done', expect.anything())
  })
})
