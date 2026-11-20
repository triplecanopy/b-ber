import * as commands from '../../src/commands'
import { noExtraArguments } from '../../src/lib/arguments'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({}))

jest.mock('@canopycanopycanopy/b-ber-lib/State', () =>
  require('../helpers/cli').createMockState()
)

jest.mock('@canopycanopycanopy/b-ber-templates/Project', () => ({}))

// A yargs stand-in that records every call and returns itself, so that any
// builder's chain runs
const mockYargs = () => {
  const calls = []
  const yargs = new Proxy(
    {},
    {
      get: (_target, method) => {
        return (...args) => {
          calls.push([method, ...args])
          return yargs
        }
      },
    }
  )
  return { yargs, calls }
}

// build checks its words against the formats instead (build.handler.test.js)
const others = Object.entries(commands).filter(([name]) => name !== 'build')

describe('every command but build', () => {
  it.each(others)('%s rejects a word none of its positionals take', (_n, c) => {
    // Issue 741: yargs 13 ignored it, so `bber opf extra` ran opf and
    // `bber new My Project` made a project called My
    const { yargs, calls } = mockYargs()
    c.builder(yargs)

    expect(calls).toContainEqual(['check', noExtraArguments])
  })
})
