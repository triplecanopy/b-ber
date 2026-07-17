import serve from '../../src/commands/serve'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  serve: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  fail: jest.fn(),
  ensure: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  notice: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}))

const mockYargs = () => ({
  positional: jest.fn().mockReturnThis(),
  option: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  help: jest.fn().mockReturnThis(),
  alias: jest.fn().mockReturnThis(),
  usage: jest.fn().mockReturnThis(),
})

describe('serve', () => {
  it('exports a yargs command object', () => {
    expect(serve).toEqual(
      expect.objectContaining({
        command: expect.anything(),
        describe: expect.any(String),
        builder: expect.any(Function),
        handler: expect.any(Function),
      })
    )
  })

  it('builder configures positional build option', () => {
    const yargs = mockYargs()
    const result = serve.builder(yargs)
    expect(result).toBeDefined()
    expect(yargs.positional).toHaveBeenCalledWith('build', expect.any(Object))
  })

  it('handler calls serve task with build and external args', () => {
    const { serve: mockServe } = jest.requireMock(
      '@canopycanopycanopy/b-ber-tasks'
    )
    serve.handler({ build: 'reader', external: false })
    expect(mockServe).toHaveBeenCalledWith({ build: 'reader', external: false })
  })
})
