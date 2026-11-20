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

  // `serialize` runs a sequence and `serve` runs `serialize`, so neither is a
  // step of one
  test('exports every task, serialize and serve', () => {
    expect(Object.keys(tasks).sort()).toEqual(
      [...Object.keys(handlers), 'serialize', 'serve'].sort()
    )
    for (const task of Object.values(tasks)) {
      expect(task).toBeFunction()
    }
  })
})
