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
  it('registers a fail handler that shows this command’s help and exits 1', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined)
    const write = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true)
    const yargs = { ...mockYargs(), showHelp: jest.fn() }
    cover.builder(yargs)

    const [handler] = yargs.fail.mock.calls[0]
    handler('Unknown argument: x', undefined)

    expect(yargs.showHelp).toHaveBeenCalled()
    expect(exit).toHaveBeenCalledWith(1)
    exit.mockRestore()
    write.mockRestore()
  })

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
