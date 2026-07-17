import opf from '../../src/commands/opf'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  opf: jest.fn(),
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

describe('opf', () => {
  it('exports a yargs command object', () => {
    expect(opf).toEqual(
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
    const result = opf.builder(yargs)
    expect(result).toBeDefined()
    expect(yargs.help).toHaveBeenCalledWith('h')
  })
})
