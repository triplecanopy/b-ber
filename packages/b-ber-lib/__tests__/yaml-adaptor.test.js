import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import YamlAdaptor from '../src/YamlAdaptor'

// Prevent the logger from calling process.exit when testing error paths
jest.mock('@canopycanopycanopy/b-ber-logger')

let tmpDir
let tmpFile

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'b-ber-lib-yaml-'))
  tmpFile = path.join(tmpDir, 'data.yml')
  await fs.writeFile(tmpFile, 'title: Hello\nauthor: World\n', 'utf8')
})

afterAll(() => fs.remove(tmpDir))

describe('YamlAdaptor.toYaml', () => {
  it('serializes a string', () => {
    const result = YamlAdaptor.toYaml('hello')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('serializes a plain object', () => {
    const result = YamlAdaptor.toYaml({ foo: 'bar' })
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('serializes an array', () => {
    const result = YamlAdaptor.toYaml(['a', 'b'])
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('throws TypeError for a number', () => {
    expect(() => YamlAdaptor.toYaml(42)).toThrow(TypeError)
  })

  it('throws TypeError for null', () => {
    expect(() => YamlAdaptor.toYaml(null)).toThrow(TypeError)
  })

  it('throws TypeError for undefined', () => {
    expect(() => YamlAdaptor.toYaml(undefined)).toThrow(TypeError)
  })
})

describe('YamlAdaptor.parse', () => {
  it('parses a YAML mapping', () => {
    expect(YamlAdaptor.parse('foo: bar')).toEqual({ foo: 'bar' })
  })

  it('parses a YAML sequence', () => {
    expect(YamlAdaptor.parse('- a\n- b')).toEqual(['a', 'b'])
  })

  it('parses a scalar value', () => {
    expect(YamlAdaptor.parse('42')).toBe(42)
  })
})

describe('YamlAdaptor.dump', () => {
  it('serializes an object to a YAML string', () => {
    const result = YamlAdaptor.dump({ foo: 'bar' })
    expect(result).toContain('foo:')
    expect(result).toContain('bar')
  })

  it('returns a string', () => {
    expect(typeof YamlAdaptor.dump({ x: 1 })).toBe('string')
  })
})

describe('YamlAdaptor.load', () => {
  it('reads and parses a YAML file from disk', () => {
    const result = YamlAdaptor.load(tmpFile)
    expect(result).toEqual({ title: 'Hello', author: 'World' })
  })

  it('returns an empty array when the file does not exist', () => {
    const result = YamlAdaptor.load(path.join(tmpDir, 'nonexistent.yml'))
    expect(result).toEqual([])
  })
})
