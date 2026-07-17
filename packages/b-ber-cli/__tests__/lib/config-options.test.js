import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import {
  blacklistedConfigOptions,
  parseConfigFile,
  withConfigOptions,
} from '../../src/lib/config-options'

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
}))

const mockYargs = () => ({
  option: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  help: jest.fn().mockReturnThis(),
  alias: jest.fn().mockReturnThis(),
  usage: jest.fn().mockReturnThis(),
})

describe('withConfigOptions', () => {
  it('adds all expected options to yargs', () => {
    const yargs = mockYargs()
    const result = withConfigOptions(yargs)
    expect(result).toBe(yargs)
    expect(yargs.option).toHaveBeenCalledWith('env', expect.any(Object))
    expect(yargs.option).toHaveBeenCalledWith('theme', expect.any(Object))
    expect(yargs.option).toHaveBeenCalledWith('src', expect.any(Object))
    expect(yargs.option).toHaveBeenCalledWith('config', expect.any(Object))
  })
})

describe('blacklistedConfigOptions', () => {
  it('is a Set containing ibooks_specified_fonts', () => {
    expect(blacklistedConfigOptions).toBeInstanceOf(Set)
    expect(blacklistedConfigOptions.has('ibooks_specified_fonts')).toBe(true) // eslint-disable-line camelcase
    expect(blacklistedConfigOptions.has('downloads')).toBe(true)
  })
})

describe('parseConfigFile', () => {
  let tmpDir

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'b-ber-cli-config-'))
  })

  afterAll(() => fs.remove(tmpDir))

  it('parses a JSON config file', async () => {
    const configFile = path.join(tmpDir, 'config.json')
    await fs.writeFile(configFile, JSON.stringify({ src: '_project' }), 'utf8')
    const result = await parseConfigFile(configFile)
    expect(result).toEqual({ src: '_project' })
  })

  it('parses a YAML config file', async () => {
    const configFile = path.join(tmpDir, 'config.yml')
    await fs.writeFile(configFile, 'src: _project\n', 'utf8')
    const result = await parseConfigFile(configFile)
    expect(typeof result).toBe('object')
  })

  it('calls log.error if config file does not exist', async () => {
    // eslint-disable-next-line global-require
    const log = jest.requireMock('@canopycanopycanopy/b-ber-logger')
    jest.clearAllMocks()
    const configFile = path.join(tmpDir, 'nonexistent.json')
    await parseConfigFile(configFile).catch(() => {})
    expect(log.error).toHaveBeenCalled()
  })

  it('calls log.error for unsupported file extension', async () => {
    // eslint-disable-next-line global-require
    const log = jest.requireMock('@canopycanopycanopy/b-ber-logger')
    jest.clearAllMocks()
    const configFile = path.join(tmpDir, 'config.txt')
    await fs.writeFile(configFile, 'data', 'utf8')
    await parseConfigFile(configFile).catch(() => {})
    expect(log.error).toHaveBeenCalled()
  })
})
