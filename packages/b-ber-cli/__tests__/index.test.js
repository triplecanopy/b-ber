import pkg from '../package.json'

// src/index.ts is the `bber` binary: it runs on require.

jest.mock('../src/app', () => ({ __esModule: true, default: jest.fn() }))

const runBin = (args) => {
  const savedArgv = process.argv
  process.argv = ['node', 'bber', ...args]
  let app
  try {
    jest.isolateModules(() => {
      app = require('../src/app').default
      require('../src/index')
    })
  } finally {
    process.argv = savedArgv
  }
  return app
}

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => undefined)
})

afterEach(() => jest.restoreAllMocks())

describe('bber binary', () => {
  it.each(['--version', '-v'])('prints the package version for %s', (flag) => {
    const app = runBin([flag])
    expect(console.log).toHaveBeenCalledWith(pkg.version)
    expect(app).not.toHaveBeenCalled()
  })

  it('hands every other invocation to the yargs app', () => {
    const app = runBin(['build', 'epub'])
    expect(app).toHaveBeenCalledTimes(1)
    expect(console.log).not.toHaveBeenCalled()
  })
})
