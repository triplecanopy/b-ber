import fs from 'fs-extra'
import os from 'os'
import path from 'path'
import YamlAdaptor from '../src/YamlAdaptor'

// Prevent the logger from calling process.exit when testing error paths
jest.mock('@canopycanopycanopy/b-ber-logger')

// Every expected value in this file is what js-yaml 3's safeLoad/safeDump
// produced. They are the contract YamlAdaptor keeps across js-yaml upgrades:
// a book's config.yml, toc.yml, metadata.yml and front matter must mean the
// same thing, and the files b-ber writes must not change, whichever version
// does the parsing (TASK-140).

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
    expect(YamlAdaptor.toYaml('hello')).toBe('hello\n')
  })

  it('serializes a plain object as a quoted JSON string', () => {
    expect(YamlAdaptor.toYaml({ foo: 'bar' })).toBe(`'{"foo":"bar"}'\n`)
  })

  it('serializes an array as a quoted JSON string', () => {
    expect(YamlAdaptor.toYaml(['a', 'b'])).toBe(`'["a","b"]'\n`)
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

  // Plain scalars are where YAML versions and schemas disagree. These are the
  // resolutions js-yaml 3's default safe schema made.
  it.each([
    // booleans: only the YAML 1.2 spellings
    ['true', true],
    ['True', true],
    ['FALSE', false],
    ['yes', 'yes'],
    ['No', 'No'],
    ['on', 'on'],
    ['off', 'off'],
    ['y', 'y'],
    ['n', 'n'],
    // nulls
    ['~', null],
    ['null', null],
    ['Null', null],
    ['', null],
    // integers, including YAML 1.1 forms
    ['42', 42],
    ['-17', -17],
    ['-0', 0],
    ['0123', 83],
    ['0x1F', 31],
    ['0b101', 5],
    ['1_000', 1000],
    ['1:23', 83],
    ['0o17', '0o17'],
    ['08', '08'],
    ['0128', '0128'],
    ['1_', '1_'],
    // floats
    ['1.5', 1.5],
    ['.5', 0.5],
    ['1e3', 1000],
    ['6.02e23', 6.02e23],
    ['1_000.5', 1000.5],
    ['190:20:30.15', 685230.15],
    ['.inf', Infinity],
    ['-.Inf', -Infinity],
    ['012.34', '012.34'],
    ['00.5', '00.5'],
    ['+.5', '+.5'],
    // timestamps
    ['2020-01-15', new Date(Date.UTC(2020, 0, 15))],
    ['2020-01-15T10:30:00Z', new Date(Date.UTC(2020, 0, 15, 10, 30))],
    ['2020-01-15 10:30:00', new Date(Date.UTC(2020, 0, 15, 10, 30))],
    ['2020-1-5', '2020-1-5'],
    // strings that look like something else
    ['en-US', 'en-US'],
    ['978-3-16-148410-0', '978-3-16-148410-0'],
    ['9783161484100', 9783161484100],
    ['v1.0', 'v1.0'],
    ['1.0.0', '1.0.0'],
    ['© 2019', '© 2019'],
  ])('resolves the plain scalar %j as js-yaml 3 did', (source, expected) => {
    expect(YamlAdaptor.parse(`value: ${source}`)).toEqual({ value: expected })
  })

  it('parses .nan as NaN', () => {
    expect(YamlAdaptor.parse('value: .nan').value).toBeNaN()
  })

  it('merges mappings with <<', () => {
    expect(
      YamlAdaptor.parse('base: &b\n  a: 1\nchild:\n  <<: *b\n  c: 2\n')
    ).toEqual({ base: { a: 1 }, child: { a: 1, c: 2 } })
  })

  it('stringifies complex mapping keys', () => {
    expect(YamlAdaptor.parse('? [a, b]\n: c\n')).toEqual({ 'a,b': 'c' })
  })

  it('reads !!omap and !!pairs as arrays of single-key mappings', () => {
    expect(YamlAdaptor.parse('a: !!omap [x: 1, y: 2]\n')).toEqual({
      a: [{ x: 1 }, { y: 2 }],
    })
    expect(YamlAdaptor.parse('a: !!pairs [x: 1, x: 2]\n')).toEqual({
      a: [
        ['x', 1],
        ['x', 2],
      ],
    })
  })

  it('reads block scalars', () => {
    expect(
      YamlAdaptor.parse('a: |\n  line 1\n  line 2\nb: >\n  folded\n  text\n')
    ).toEqual({ a: 'line 1\nline 2\n', b: 'folded text\n' })
  })

  // Front matter can be empty, and an empty block reaches parse() as ''.
  it('returns nothing for an empty document', () => {
    expect(YamlAdaptor.parse('')).toBeUndefined()
  })

  it('returns nothing for a document of only comments or whitespace', () => {
    expect(YamlAdaptor.parse('# just a comment\n') == null).toBe(true)
    expect(YamlAdaptor.parse('   \n\n') == null).toBe(true)
  })

  it('returns null for an explicit empty document', () => {
    expect(YamlAdaptor.parse('---\n')).toBeNull()
  })

  it('throws on more than one document', () => {
    expect(() => YamlAdaptor.parse('a: 1\n---\nb: 2\n')).toThrow(
      /single document/
    )
  })

  it('throws on a duplicated key', () => {
    expect(() => YamlAdaptor.parse('a: 1\na: 2\n')).toThrow(/duplicated/)
  })

  it('throws on invalid YAML', () => {
    expect(() => YamlAdaptor.parse('title: New: Page\n')).toThrow()
  })
})

// Where js-yaml 5 deliberately departs from 3. Each was either a security fix
// or 3 accepting input it should not have.
describe('YamlAdaptor.parse, differences from js-yaml 3', () => {
  it('keeps __proto__ as an own key instead of setting the prototype', () => {
    const result = YamlAdaptor.parse('__proto__: {polluted: 1}\na: 1\n')

    expect(Object.getOwnPropertyNames(result)).toEqual(['__proto__', 'a'])
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
    expect({}.polluted).toBeUndefined()
  })

  // CVE-2026-84375, CVE-2026-59869 and CVE-2026-53550: merge keys that made
  // js-yaml 3 spend quadratic CPU time. js-yaml 5 caps merge work and throws.
  it('rejects merge-key documents built to exhaust the CPU', () => {
    const emptyMerges = [
      `arr: &arr [${new Array(20000).fill('{}').join(',')}]`,
      'targets:',
      ...new Array(20000).fill('  - <<: *arr'),
    ].join('\n')
    const chain = [
      'a0: &a0 { k0: 0 }',
      ...Array.from(
        { length: 4000 },
        (_, i) => `a${i + 1}: &a${i + 1} { <<: *a${i}, k${i + 1}: ${i + 1} }`
      ),
      'b: *a4000',
    ].join('\n')
    const keys = Array.from({ length: 4000 }, (_, i) => `k${i}: 0`).join(', ')
    const repeated = `a: &a {${keys}}\nb: {<<: [${new Array(4000).fill('*a').join(', ')}]}\n`

    expect(() => YamlAdaptor.parse(emptyMerges)).toThrow(/merge/)
    expect(() => YamlAdaptor.parse(chain)).toThrow(/maxTotalMergeKeys/)
    expect(() => YamlAdaptor.parse(repeated)).toThrow(/merge/)
  })

  it('rejects tab indentation, which js-yaml 3 misread', () => {
    // js-yaml 3 returned { a: null, b: 1 }
    expect(() => YamlAdaptor.parse('a:\n\tb: 1\n')).toThrow(/tab/)
  })

  it('rejects an empty flow sequence entry', () => {
    // js-yaml 3 returned { a: ['x', null, 'y'] }
    expect(() => YamlAdaptor.parse('a: [x,,y]\n')).toThrow()
  })

  it('leaves an impossible date as a string', () => {
    // js-yaml 3 rolled 2020-02-30 over to 2020-03-01
    expect(YamlAdaptor.parse('a: 2020-02-30\n')).toEqual({ a: '2020-02-30' })
  })

  it('reads years before 100 as written', () => {
    // js-yaml 3 read 0099-01-01 as 1999-01-01
    expect(YamlAdaptor.parse('a: 0099-01-01\n').a.getUTCFullYear()).toBe(99)
  })

  it('rejects the !!binary and !!set tags', () => {
    expect(() => YamlAdaptor.parse('a: !!binary aGVsbG8=\n')).toThrow(/unknown/)
    expect(() => YamlAdaptor.parse('a: !!set {x}\n')).toThrow(/unknown/)
  })
})

describe('YamlAdaptor.dump', () => {
  it('writes the same text js-yaml 3 wrote', () => {
    const value = {
      title: 'Kitchen Sink',
      creator: 'Last Name, First Name',
      url: 'http://localhost:4000/project-reader',
      query: '> 1%',
      browsers: ['defaults', 'not IE 11', 'no-2009'],
      path: './themes',
      root: '/',
      hash: 'a #b',
      comment: '#c',
      dash: '- d',
      flow: '[x] {y}',
      at: '@z',
      apostrophe: "it's",
      quotes: 'say "hi"',
      unicode: 'Ça va — “quotes”',
      ambiguous: [
        'yes',
        'no',
        'on',
        'off',
        'y',
        'n',
        'true',
        'null',
        '~',
        '',
        ' ',
        '1:23',
        '0123',
        '12e3',
        '2020-01-15',
        '1_000',
        '.inf',
      ],
      colon: 'term: value',
      multiline: 'line one\nline two\n',
      folded:
        'A long sentence with spaces that runs well past the eighty column default line width of the dumper.',
      date: new Date('2020-01-15T00:00:00Z'),
      nothing: null,
      yes: true,
      no: false,
      int: 42,
      negative: -1,
      float: 1.5,
      empty: { list: [], map: {} },
      nested: [{ a: 1, b: [2, 3] }, [4, 5]],
      'key with spaces': 1,
      'key: colon': 2,
    }

    expect(YamlAdaptor.dump(value)).toBe(
      [
        'title: Kitchen Sink',
        "creator: 'Last Name, First Name'",
        "url: 'http://localhost:4000/project-reader'",
        "query: '> 1%'",
        'browsers:',
        '  - defaults',
        '  - not IE 11',
        '  - no-2009',
        'path: ./themes',
        'root: /',
        "hash: 'a #b'",
        "comment: '#c'",
        "dash: '- d'",
        "flow: '[x] {y}'",
        "at: '@z'",
        "apostrophe: it's",
        'quotes: say "hi"',
        'unicode: Ça va — “quotes”',
        'ambiguous:',
        "  - 'yes'",
        "  - 'no'",
        "  - 'on'",
        "  - 'off'",
        "  - 'y'",
        "  - 'n'",
        "  - 'true'",
        "  - 'null'",
        "  - '~'",
        "  - ''",
        "  - ' '",
        "  - '1:23'",
        "  - '0123'",
        "  - '12e3'",
        "  - '2020-01-15'",
        "  - '1_000'",
        "  - '.inf'",
        "colon: 'term: value'",
        'multiline: |',
        '  line one',
        '  line two',
        'folded: >-',
        '  A long sentence with spaces that runs well past the eighty column default line',
        '  width of the dumper.',
        'date: 2020-01-15T00:00:00.000Z',
        'nothing: null',
        "'yes': true",
        "'no': false",
        'int: 42',
        'negative: -1',
        'float: 1.5',
        'empty:',
        '  list: []',
        '  map: {}',
        'nested:',
        '  - a: 1',
        '    b:',
        '      - 2',
        '      - 3',
        '  - - 4',
        '    - 5',
        'key with spaces: 1',
        "'key: colon': 2",
        '',
      ].join('\n')
    )
  })

  it('writes text that parses back to the same value', () => {
    const value = {
      remote_url: 'http://localhost:4000/',
      ignore: ['drafts', 'notes: misc'],
      date: new Date('2020-01-15T00:00:00Z'),
      flags: { private: false, count: 3 },
    }
    expect(YamlAdaptor.parse(YamlAdaptor.dump(value))).toEqual(value)
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

  it('returns an empty array for an empty file', async () => {
    const empty = path.join(tmpDir, 'empty.yml')
    await fs.writeFile(empty, '')
    expect(YamlAdaptor.load(empty)).toEqual([])
  })

  it('reads a toc.yml with nested sections and per-entry attributes', async () => {
    const toc = path.join(tmpDir, 'toc.yml')
    await fs.writeFile(
      toc,
      [
        '- chapter-01',
        '- section:',
        '    - a',
        '    - b:',
        '        in_toc: false',
        '- c:',
        '    linear: false',
        '',
      ].join('\n')
    )
    expect(YamlAdaptor.load(toc)).toEqual([
      'chapter-01',
      { section: ['a', { b: { in_toc: false } }] },
      { c: { linear: false } },
    ])
  })
})
