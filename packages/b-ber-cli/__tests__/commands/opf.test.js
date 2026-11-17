import opf from '../../src/commands/opf'

jest.mock('@canopycanopycanopy/b-ber-tasks', () => ({
  opf: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  fail: jest.fn(),
  ensure: jest.fn(),
}))

const mockYargs = () => ({
  check: jest.fn().mockReturnThis(),
  positional: jest.fn().mockReturnThis(),
  option: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  help: jest.fn().mockReturnThis(),
  alias: jest.fn().mockReturnThis(),
  usage: jest.fn().mockReturnThis(),
})

describe('opf', () => {
  it('registers a fail handler that shows this command’s help and exits 1', () => {
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined)
    const write = jest
      .spyOn(process.stdout, 'write')
      .mockImplementation(() => true)
    const yargs = { ...mockYargs(), showHelp: jest.fn() }
    opf.builder(yargs)

    const [handler] = yargs.fail.mock.calls[0]
    handler('Unknown argument: x', undefined)

    expect(yargs.showHelp).toHaveBeenCalled()
    expect(exit).toHaveBeenCalledWith(1)
    exit.mockRestore()
    write.mockRestore()
  })

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

  it('registers a fail handler, so a usage error is reported and exits 1', () => {
    // Issue 741: opf used to register none
    const yargs = mockYargs()
    opf.builder(yargs)
    expect(yargs.fail).toHaveBeenCalledWith(expect.any(Function))
  })
})
