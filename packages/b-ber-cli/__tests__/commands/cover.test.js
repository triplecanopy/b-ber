import cover from '../../src/commands/cover'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  cover: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  fail: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({}))

const mockYargs = () => ({
  positional: jest.fn().mockReturnThis(),
  option: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  help: jest.fn().mockReturnThis(),
  alias: jest.fn().mockReturnThis(),
  usage: jest.fn().mockReturnThis(),
})

describe('cover', () => {
  it('exports a yargs command object', () => {
    expect(cover).toEqual(
      expect.objectContaining({
        command: expect.anything(),
        describe: expect.any(String),
        builder: expect.any(Function),
        handler: expect.any(Function),
      })
    )
  })

  it('builder configures help and usage', () => {
    const yargs = mockYargs()
    const result = cover.builder(yargs)
    expect(result).toBeDefined()
    expect(yargs.help).toHaveBeenCalledWith('h')
    expect(yargs.usage).toHaveBeenCalled()
  })
})
