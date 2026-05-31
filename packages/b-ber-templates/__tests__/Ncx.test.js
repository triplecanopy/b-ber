import Ncx from '../src/Ncx'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  metadata: {
    json: () => [
      { term: 'identifier', value: 'urn:uuid:test-identifier' },
      { term: 'title', value: 'Test Book Title' },
      { term: 'creator', value: 'Test Author' },
    ],
  },
  spine: {
    frontMatter: { get: () => null },
  },
}))

describe('templates.Ncx', () => {
  test('head() renders dtb meta elements with identifier', () => {
    expect(Ncx.head()).toMatchSnapshot()
  })

  test('title() renders docTitle from metadata', () => {
    expect(Ncx.title()).toMatchSnapshot()
  })

  test('author() renders docAuthor from metadata', () => {
    expect(Ncx.author()).toMatchSnapshot()
  })

  test('document() returns a Vinyl file with full NCX structure', () => {
    const doc = Ncx.document()
    expect(doc.contents.toString()).toMatchSnapshot()
    expect(doc.path).toBe('ncx.document.tmpl')
  })

  test('navPoint() renders navLabel and content src', () => {
    const data = {
      relativePath: 'text/chapter-01',
      title: 'Chapter One',
      nodes: [],
    }
    expect(Ncx.navPoint(data)).toMatchSnapshot()
  })

  test('navPoints() renders a flat list', () => {
    /* eslint-disable camelcase */
    const data = [
      {
        relativePath: 'text/ch-01',
        title: 'Chapter 1',
        in_toc: true,
        nodes: [],
      },
      {
        relativePath: 'text/ch-02',
        title: 'Chapter 2',
        in_toc: true,
        nodes: [],
      },
    ]
    /* eslint-enable camelcase */
    expect(Ncx.navPoints(data)).toMatchSnapshot()
  })

  test('navPoints() skips entries where in_toc is false', () => {
    /* eslint-disable camelcase */
    const data = [
      { relativePath: 'text/ch-01', title: 'Visible', in_toc: true, nodes: [] },
      { relativePath: 'text/ch-02', title: 'Hidden', in_toc: false, nodes: [] },
    ]
    /* eslint-enable camelcase */
    const result = Ncx.navPoints(data)
    expect(result).toContain('Visible')
    expect(result).not.toContain('Hidden')
  })

  test('navPoints() renders nested nodes recursively', () => {
    /* eslint-disable camelcase */
    const data = [
      {
        relativePath: 'text/ch-01',
        title: 'Chapter 1',
        in_toc: true,
        nodes: [
          {
            relativePath: 'text/ch-01-section-01',
            title: 'Section 1.1',
            in_toc: true,
            nodes: [],
          },
        ],
      },
    ]
    /* eslint-enable camelcase */
    const result = Ncx.navPoints(data)
    expect(result).toMatchSnapshot()
  })

  test('navPoints() returns empty string for empty input', () => {
    expect(Ncx.navPoints([])).toBe('')
  })

  test('navPoints() returns empty string for null input', () => {
    expect(Ncx.navPoints(null)).toBe('')
  })
})
