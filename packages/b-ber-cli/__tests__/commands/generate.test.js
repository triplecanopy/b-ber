import generate from '../../src/commands/generate'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  generate: jest.fn(),
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

describe('generate', () => {
  it('registers a fail handler that shows this command’s help and exits 1', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined)
    const write = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true)
    const yargs = { ...mockYargs(), showHelp: jest.fn() }
    generate.builder(yargs)

    const [handler] = yargs.fail.mock.calls[0]
    handler('Unknown argument: x', undefined)

    expect(yargs.showHelp).toHaveBeenCalled()
    expect(exit).toHaveBeenCalledWith(1)
    exit.mockRestore()
    write.mockRestore()
  })

  it('exports a yargs command object', () => {
    expect(generate).toEqual(
      expect.objectContaining({
        command: expect.anything(),
        describe: expect.any(String),
        builder: expect.any(Function),
        handler: expect.any(Function),
      })
    )
  })

  it('builder configures title and type positional options', () => {
    const yargs = mockYargs()
    const result = generate.builder(yargs)
    expect(result).toBeDefined()
    expect(yargs.positional).toHaveBeenCalledWith('title', expect.any(Object))
    expect(yargs.positional).toHaveBeenCalledWith('type', expect.any(Object))
  })
})
