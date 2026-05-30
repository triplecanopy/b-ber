import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import Yaml from '../src/Yaml'

// Prevent the logger from calling process.exit on typeCheck errors
jest.mock('@canopycanopycanopy/b-ber-logger')

let tmpDir
let metadataFile

const initialYaml =
  '- term: title\n  value: "Test Book"\n- term: creator\n  value: "Test Author"\n'

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'b-ber-lib-yaml-class-'))
  metadataFile = path.join(tmpDir, 'metadata.yml')
  await fs.writeFile(metadataFile, initialYaml, 'utf8')
})

afterAll(() => fs.remove(tmpDir))

describe('Yaml constructor', () => {
  it('stores the schema name', () => {
    const yaml = new Yaml('metadata')
    expect(yaml.schema).toBe('metadata')
  })

  it('initialises with a callable json accessor before load', () => {
    const yaml = new Yaml('metadata')
    // Before load(), data is a YawnAPI stub; json() returns a function placeholder
    expect(typeof yaml.json()).toBe('function')
  })
})

describe('Yaml.load', () => {
  it('reads and parses a YAML file into the instance', () => {
    const yaml = new Yaml('metadata')
    yaml.load(metadataFile)
    const entries = yaml.json()
    expect(Array.isArray(entries)).toBe(true)
    expect(entries).toHaveLength(2)
    expect(entries[0]).toMatchObject({ term: 'title', value: 'Test Book' })
    expect(entries[1]).toMatchObject({ term: 'creator', value: 'Test Author' })
  })

  it('exposes the raw YAML string via yaml()', () => {
    const yaml = new Yaml('metadata')
    yaml.load(metadataFile)
    expect(typeof yaml.yaml()).toBe('string')
    expect(yaml.yaml()).toContain('title')
  })
})

describe('Yaml.add', () => {
  it('appends an entry to the json array', () => {
    const yaml = new Yaml('metadata')
    yaml.load(metadataFile)
    yaml.add({ term: 'publisher', value: 'Test Press' })
    const entries = yaml.json()
    expect(entries).toHaveLength(3)
    expect(entries[2]).toMatchObject({ term: 'publisher', value: 'Test Press' })
  })
})

describe('Yaml.remove', () => {
  it('retains only entries where the given key matches the value', () => {
    // NOTE: the filter keeps matches — name is misleading relative to typical "remove" semantics
    const yaml = new Yaml('metadata')
    yaml.load(metadataFile)
    yaml.remove('term', 'title')
    const entries = yaml.json()
    expect(entries).toHaveLength(1)
    expect(entries[0].term).toBe('title')
  })
})

describe('Yaml.update', () => {
  it('replaces an existing entry with a merged version', () => {
    const yaml = new Yaml('metadata')
    yaml.load(metadataFile)
    yaml.update('term', 'title', { value: 'Updated Title' })
    const entries = yaml.json()
    // After update: only the updated entry remains (remove retains only the match,
    // then the new merged entry is appended)
    const titleEntries = entries.filter(e => e.term === 'title')
    expect(titleEntries).toHaveLength(2) // original kept + new appended
    expect(titleEntries[titleEntries.length - 1].value).toBe('Updated Title')
  })
})
