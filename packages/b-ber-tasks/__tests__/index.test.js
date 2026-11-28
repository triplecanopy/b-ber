/**
 * @jest-environment node
 */

// The package's public surface: what b-ber-cli imports, and the names a build
// sequence can use. Node, not jsdom: importing every task imports cheerio,
// which under jsdom resolves to a browser ESM build Jest cannot load.

import sequences from '@canopycanopycanopy/b-ber-shapes-sequences/sequences'
import * as index from '../src'
import * as taskHandlers from '../src/task-handlers'

jest.mock('@canopycanopycanopy/b-ber-logger')

const tasks = { ...index }
const handlers = { ...taskHandlers }
const sequenced = [...new Set(Object.values(sequences).flat())]

describe('b-ber-tasks', () => {
  test.each(sequenced)('a build sequence can run [%s]', (name) => {
    expect(handlers[name]).toBeFunction()
  })

  // `build` builds a target, `step` runs one of its steps, and `serve`
  // builds one, so none of them is a step itself
  test('exports every task, and what runs them', () => {
    const { targetNames, ...functions } = tasks
    expect(Object.keys(functions).sort()).toEqual(
      [
        ...Object.keys(handlers),
        'build',
        'serialize',
        'serve',
        'step',
        'targetSteps',
      ].sort()
    )
    for (const task of Object.values(functions)) {
      expect(task).toBeFunction()
    }
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
})
