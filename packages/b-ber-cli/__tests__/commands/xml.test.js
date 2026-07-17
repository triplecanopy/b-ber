import xml from '../../src/commands/xml'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  xml: jest.fn(),
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

describe('xml', () => {
  it('exports a yargs command object', () => {
    expect(xml).toEqual(
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
    const result = xml.builder(yargs)
    expect(result).toBeDefined()
    expect(yargs.help).toHaveBeenCalledWith('h')
  })
})
