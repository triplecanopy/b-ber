import Spine from '../src/Spine'
import YamlAdaptor from '../src/YamlAdaptor'

jest.mock('../src/YamlAdaptor', () => ({
  load: jest.fn(() => []),
}))

jest.mock('glob', () => ({
  sync: jest.fn(() => []),
}))

const OPTIONS = {
  src: '/fake',
  buildType: 'epub',
  navigationConfigFile: '/fake/toc.yml',
}

describe('Spine', () => {
  let glob

  beforeEach(() => {
    jest.clearAllMocks()
    // eslint-disable-next-line global-require
    glob = require('glob')
    glob.sync.mockReturnValue([])
    YamlAdaptor.load.mockReturnValue([])
  })

  it('constructs with empty YAML and no files', () => {
    const spine = new Spine(OPTIONS)
    expect(spine.entries).toEqual([])
    expect(spine.nested).toEqual([])
    expect(spine.flattened).toEqual([])
  })

  it('populates frontMatter map on construction', () => {
    YamlAdaptor.load.mockReturnValue(['chapter-01', 'chapter-02'])
    const spine = new Spine(OPTIONS)
    expect(spine.frontMatter.has('chapter-01')).toBe(true)
    expect(spine.frontMatter.has('chapter-02')).toBe(true)
  })

  it('build() creates SpineItems for plain string entries', () => {
    YamlAdaptor.load.mockReturnValue(['chapter-01', 'chapter-02'])
    const spine = new Spine(OPTIONS)
    expect(spine.nested).toHaveLength(2)
    expect(spine.nested[0].fileName).toBe('chapter-01')
    expect(spine.nested[1].fileName).toBe('chapter-02')
  })

  it('build() handles objects with filename and options', () => {
    YamlAdaptor.load.mockReturnValue([
      { 'chapter-01': { title: 'Chapter One', in_toc: false } }, // eslint-disable-line camelcase
    ])
    const spine = new Spine(OPTIONS)
    expect(spine.nested).toHaveLength(1)
    expect(spine.nested[0].fileName).toBe('chapter-01')
    expect(spine.frontMatter.has('chapter-01')).toBe(true)
  })

  it('build() handles section objects for nested navigation', () => {
    YamlAdaptor.load.mockReturnValue([
      'chapter-01',
      { section: ['nested-01', 'nested-02'] },
    ])
    const spine = new Spine(OPTIONS)
    expect(spine.nested).toHaveLength(1)
    expect(spine.nested[0].nodes).toHaveLength(2)
    expect(spine.nested[0].nodes[0].fileName).toBe('nested-01')
  })

  it('flattenNodes() produces a flat one-dimensional array', () => {
    YamlAdaptor.load.mockReturnValue([
      'chapter-01',
      { section: ['nested-01', 'nested-02'] },
    ])
    const spine = new Spine(OPTIONS)
    // chapter-01 + nested-01 + nested-02
    expect(spine.flattened).toHaveLength(3)
    expect(spine.flattened.map(i => i.fileName)).toEqual([
      'chapter-01',
      'nested-01',
      'nested-02',
    ])
  })

  it('flattenNodes() handles items with no child nodes', () => {
    YamlAdaptor.load.mockReturnValue(['chapter-01', 'chapter-02'])
    const spine = new Spine(OPTIONS)
    expect(spine.flattened).toHaveLength(2)
  })

  it('flattenYAML() passes through plain strings', () => {
    YamlAdaptor.load.mockReturnValue(['a', 'b', 'c'])
    const spine = new Spine(OPTIONS)
    expect(spine.flattenYAML(['a', 'b', 'c'])).toEqual(['a', 'b', 'c'])
  })

  it('flattenYAML() extracts the key from plain objects', () => {
    YamlAdaptor.load.mockReturnValue([])
    const spine = new Spine(OPTIONS)
    expect(spine.flattenYAML([{ 'chapter-01': { title: 'C1' } }])).toEqual([
      'chapter-01',
    ])
  })

  it('flattenYAML() recurses into section objects', () => {
    YamlAdaptor.load.mockReturnValue([])
    const spine = new Spine(OPTIONS)
    const result = spine.flattenYAML([{ section: ['nested-01', 'nested-02'] }])
    expect(result).toEqual(['nested-01', 'nested-02'])
  })

  it('flattenYAML() handles mixed plain strings and objects', () => {
    YamlAdaptor.load.mockReturnValue([])
    const spine = new Spine(OPTIONS)
    const result = spine.flattenYAML([
      'intro',
      { 'chapter-01': {} },
      { section: ['nested-01'] },
    ])
    expect(result).toEqual(['intro', 'chapter-01', 'nested-01'])
  })

  it('create() appends files from disk not declared in YAML', () => {
    YamlAdaptor.load.mockReturnValue(['chapter-01'])
    glob.sync.mockReturnValue([
      '/fake/_markdown/chapter-01.md',
      '/fake/_markdown/chapter-02.md',
    ])
    const spine = new Spine(OPTIONS)
    expect(spine.entries).toContain('chapter-02')
    expect(spine.entries).toHaveLength(2)
  })

  it('create() does not duplicate files already in YAML', () => {
    YamlAdaptor.load.mockReturnValue(['chapter-01'])
    glob.sync.mockReturnValue(['/fake/_markdown/chapter-01.md'])
    const spine = new Spine(OPTIONS)
    const chapterCount = spine.entries.filter(e => e === 'chapter-01').length
    expect(chapterCount).toBe(1)
  })
})
