import _new from '../../src/commands/new'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  _new: jest.fn(),
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

describe('new', () => {
  it('exports a yargs command object', () => {
    expect(_new).toEqual(
      expect.objectContaining({
        command: expect.anything(),
        describe: expect.any(String),
        builder: expect.any(Function),
        handler: expect.any(Function),
      })
    )
  })

  it('builder configures positional and config options', () => {
    const yargs = mockYargs()
    const result = _new.builder(yargs)
    expect(result).toBeDefined()
    expect(yargs.positional).toHaveBeenCalledWith('name', expect.any(Object))
    expect(yargs.option).toHaveBeenCalled()
  })
})
