import theme from '../../src/commands/theme'

jest.mock('@canopycanopycanopy/b-ber-lib/Theme', () => ({}))

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  theme: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  fail: jest.fn(),
  ensure: jest.fn(),
}))

const mockYargs = () => ({
  positional: jest.fn().mockReturnThis(),
  option: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  help: jest.fn().mockReturnThis(),
  alias: jest.fn().mockReturnThis(),
  usage: jest.fn().mockReturnThis(),
})

describe('theme', () => {
  it('exports a yargs command object', () => {
    expect(theme).toEqual(
      expect.objectContaining({
        command: expect.anything(),
        describe: expect.any(String),
        builder: expect.any(Function),
        handler: expect.any(Function),
      })
    )
  })

  it('builder configures command and options positional arguments', () => {
    const yargs = mockYargs()
    const result = theme.builder(yargs)
    expect(result).toBeDefined()
    expect(yargs.positional).toHaveBeenCalledWith('command', expect.any(Object))
  })
})
