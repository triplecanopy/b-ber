/**
 * @jest-environment node
 */

// The package's public surface: what b-ber-cli imports, and the steps a target's
// build runs. Node, not jsdom: importing every task imports cheerio,
// which under jsdom resolves to a browser ESM build Jest cannot load.

import * as index from '../src'
import { targetNames, targetSteps } from '../src/targets'

jest.mock('@canopycanopycanopy/b-ber-logger')

const tasks = { ...index }

// Every step a target's build runs, each an exported task
const steps = [...new Set(targetNames.flatMap((name) => targetSteps(name)))]

describe('b-ber-tasks', () => {
  test.each(steps)('a target build step is an exported task [%s]', (name) => {
    expect(tasks[name]).toBeFunction()
  })

  // `build` builds a target, `step` runs one of its steps, and `serve`
  // builds one; the others are the commands' own tasks
  test('exports every task, and what runs them', () => {
    const { targetNames: names, ...functions } = tasks
    expect(Object.keys(functions).sort()).toEqual(
      [
        ...steps,
        'build',
        'deploy',
        'generate',
        'init',
        'serve',
        'step',
        'targetSteps',
        'validate',
      ].sort()
    )
    for (const task of Object.values(functions)) {
      expect(task).toBeFunction()
    }
    expect(names).toEqual(targetNames)
  })
})
