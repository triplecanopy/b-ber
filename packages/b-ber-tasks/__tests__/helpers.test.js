import fs from 'fs-extra'
import { pathInfoFromFiles, nestedContentToYAML } from '../src/opf/helpers'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({}))
jest.mock('@canopycanopycanopy/b-ber-lib/utils', () => ({
  opsPath: (file, _dest) => `ops:${file}`,
}))

afterAll(() => Promise.all([fs.remove('_project'), fs.remove('themes')]))

describe('opf/helpers: pathInfoFromFiles', () => {
  test('returns empty array for empty input', () => {
    expect(pathInfoFromFiles([], '/dist')).toEqual([])
  })

  test('marks http:// URLs as remote', () => {
    const [result] = pathInfoFromFiles(
      ['http://example.com/font.woff'],
      '/dist'
    )
    expect(result).toEqual({
      absolutePath: 'http://example.com/font.woff',
      opsPath: 'http://example.com/font.woff',
      name: 'http://example.com/font.woff',
      extension: '',
      remote: true,
    })
  })

  test('marks https:// URLs as remote', () => {
    const [result] = pathInfoFromFiles(
      ['https://cdn.example.com/image.jpg'],
      '/dist'
    )
    expect(result.remote).toBe(true)
    expect(result.extension).toBe('')
  })

  test('processes local file paths', () => {
    const [result] = pathInfoFromFiles(['/dist/fonts/book.woff'], '/dist')
    expect(result.remote).toBe(false)
    expect(result.name).toBe('book.woff')
    expect(result.extension).toBe('.woff')
    expect(result.absolutePath).toBe('/dist/fonts/book.woff')
    expect(result.opsPath).toBe('ops:/dist/fonts/book.woff')
  })

  test('handles mixed remote and local files', () => {
    const files = ['/dist/images/cover.jpg', 'http://example.com/audio.mp3']
    const [local, remote] = pathInfoFromFiles(files, '/dist')
    expect(local.remote).toBe(false)
    expect(remote.remote).toBe(true)
  })

  test('returns one entry per input file', () => {
    const files = ['/a.jpg', '/b.png', '/c.gif']
    expect(pathInfoFromFiles(files, '/dist')).toHaveLength(3)
  })
})

describe('opf/helpers: nestedContentToYAML', () => {
  test('returns empty array for empty input', () => {
    expect(nestedContentToYAML([])).toEqual([])
  })

  test('emits bare file names for standard entries', () => {
    const items = [
      { fileName: 'chapter-01', nodes: [] },
      { fileName: 'chapter-02', nodes: [] },
    ]
    expect(nestedContentToYAML(items)).toEqual(['chapter-01', 'chapter-02'])
  })

  test('wraps entry with linear:false in an object', () => {
    const items = [{ fileName: 'appendix', linear: false, nodes: [] }]
    expect(nestedContentToYAML(items)).toEqual([
      { appendix: { linear: false } },
    ])
  })

  /* eslint-disable camelcase */
  test('wraps entry with in_toc:false in an object', () => {
    const items = [{ fileName: 'notes', in_toc: false, nodes: [] }]
    expect(nestedContentToYAML(items)).toEqual([{ notes: { in_toc: false } }])
  })

  test('includes both flags when both are false', () => {
    const items = [
      { fileName: 'cover', linear: false, in_toc: false, nodes: [] },
    ]
    expect(nestedContentToYAML(items)).toEqual([
      { cover: { linear: false, in_toc: false } },
    ])
  })
  /* eslint-enable camelcase */

  test('ignores empty nodes array', () => {
    const items = [{ fileName: 'chapter-01', nodes: [] }]
    expect(nestedContentToYAML(items)).toEqual(['chapter-01'])
  })

  test('emits a section entry for nested nodes', () => {
    const items = [
      {
        fileName: 'part-01',
        nodes: [
          { fileName: 'chapter-01', nodes: [] },
          { fileName: 'chapter-02', nodes: [] },
        ],
      },
    ]
    expect(nestedContentToYAML(items)).toEqual([
      'part-01',
      { section: ['chapter-01', 'chapter-02'] },
    ])
  })

  test('recursively processes deeply nested nodes', () => {
    const items = [
      {
        fileName: 'part-01',
        nodes: [
          {
            fileName: 'section-01',
            nodes: [{ fileName: 'chapter-01', nodes: [] }],
          },
        ],
      },
    ]
    const result = nestedContentToYAML(items)
    expect(result).toEqual([
      'part-01',
      { section: ['section-01', { section: ['chapter-01'] }] },
    ])
  })
})
