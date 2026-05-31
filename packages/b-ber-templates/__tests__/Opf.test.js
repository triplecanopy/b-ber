import state from '@canopycanopycanopy/b-ber-lib/State'
import { Pkg, Metadata, Manifest, Spine, Guide } from '../src/Opf'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  build: 'epub',
  loi: [],
}))

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  info: jest.fn(),
  notice: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/ManifestItemProperties', () => ({
  testMeta: jest.fn(() => ({ term: true, element: true })),
  testHTML: jest.fn(() => []),
}))

const ManifestItemProperties = require('@canopycanopycanopy/b-ber-lib/ManifestItemProperties')

describe('templates.Opf.Pkg', () => {
  test('body() returns a Vinyl file with the OPF package wrapper', () => {
    const file = Pkg.body()
    const content = file.contents.toString()
    expect(content).toMatchSnapshot()
    expect(file.path).toBe('pkg.body.tmpl')
    expect(content).toContain('{% body %}')
    expect(content).toContain('version="3.0"')
  })
})

describe('templates.Opf.Metadata', () => {
  test('uid() returns a hex string prefixed with underscore', () => {
    const uid = Metadata.uid()
    expect(uid).toMatch(/^_[0-9a-f]{16}$/)
  })

  test('body() returns a Vinyl file with metadata wrapper', () => {
    const file = Metadata.body()
    expect(file.contents.toString()).toBe('<metadata>{% body %}</metadata>')
    expect(file.path).toBe('metadata.body.tmpl')
  })

  test('meta() renders a dc: element and dcterms: meta when both term and element are true', () => {
    ManifestItemProperties.testMeta.mockReturnValue({
      term: true,
      element: true,
    })
    const result = Metadata.meta({ term: 'title', value: 'Test Title' })
    expect(result).toContain('<meta property="dcterms:title">Test Title</meta>')
    expect(result).toContain('<dc:title')
    expect(result).toContain('>Test Title</dc:title>')
  })

  test('meta() renders only a dcterms: meta when term=true, element=false', () => {
    ManifestItemProperties.testMeta.mockReturnValue({
      term: true,
      element: false,
    })
    const result = Metadata.meta({ term: 'modified', value: '2024-01-01' })
    expect(result).toContain('dcterms:modified')
    expect(result).not.toContain('<dc:')
  })

  test('meta() renders a plain meta element when both term and element are false', () => {
    ManifestItemProperties.testMeta.mockReturnValue({
      term: false,
      element: false,
    })
    const result = Metadata.meta({ term: 'custom', value: 'custom-value' })
    expect(result).toContain('<meta name="custom" content="custom-value"/>')
  })

  test('meta() renders a cover meta element using fileId', () => {
    ManifestItemProperties.testMeta.mockReturnValue({
      term: false,
      element: false,
    })
    const result = Metadata.meta({ term: 'cover', value: 'cover-image.jpg' })
    expect(result).toContain('<meta name="cover"')
    expect(result).not.toContain('cover-image.jpg"')
  })

  test('meta() renders identifier as uuid id when element=true and term=identifier', () => {
    ManifestItemProperties.testMeta.mockReturnValue({
      term: true,
      element: true,
    })
    const result = Metadata.meta({ term: 'identifier', value: 'urn:uuid:test' })
    expect(result).toContain('id="uuid"')
  })

  test('meta() appends refines meta elements', () => {
    ManifestItemProperties.testMeta.mockReturnValue({
      term: true,
      element: true,
    })
    const result = Metadata.meta({
      term: 'creator',
      value: 'Author Name',
      refines: [{ 'file-as': 'Name, Author' }],
    })
    expect(result).toContain('refines=')
    expect(result).toContain('file-as')
  })
})

describe('templates.Opf.Manifest', () => {
  test('body() returns a Vinyl file with manifest wrapper', () => {
    const file = Manifest.body()
    expect(file.contents.toString()).toBe('<manifest>{% body %}</manifest>')
    expect(file.path).toBe('manifest.body.tmpl')
  })

  test('item() renders an item element for a local file', () => {
    ManifestItemProperties.testHTML.mockReturnValue([])
    const file = {
      name: 'chapter-01.xhtml',
      opsPath: 'text/chapter-01.xhtml',
      absolutePath: '/path/to/text/chapter-01.xhtml',
      remote: false,
    }
    const result = Manifest.item(file)
    expect(result).toMatchSnapshot()
    expect(result).toContain('media-type="application/xhtml+xml"')
  })

  test('item() uses application/octet-stream for remote files', () => {
    ManifestItemProperties.testHTML.mockReturnValue([])
    const file = {
      name: 'remote-asset.jpg',
      opsPath: 'images/remote-asset.jpg',
      absolutePath: 'https://example.com/image.jpg',
      remote: true,
    }
    const result = Manifest.item(file)
    expect(result).toContain('media-type="application/octet-stream"')
  })

  test('item() includes properties attribute when testHTML returns values', () => {
    ManifestItemProperties.testHTML.mockReturnValue(['scripted', 'svg'])
    const file = {
      name: 'interactive.xhtml',
      opsPath: 'text/interactive.xhtml',
      absolutePath: '/path/to/interactive.xhtml',
      remote: false,
    }
    const result = Manifest.item(file)
    expect(result).toContain('properties="scripted svg"')
  })
})

describe('templates.Opf.Spine', () => {
  test('body() returns a Vinyl file with spine wrapper', () => {
    const file = Spine.body()
    expect(file.contents.toString()).toBe(
      '<spine toc="_toc_ncx">{% body %}</spine>'
    )
    expect(file.path).toBe('spine.body.tmpl')
  })

  test('item() renders a linear itemref', () => {
    const result = Spine.item({
      fileName: 'chapter-01.xhtml',
      extension: '.xhtml',
      linear: true,
    })
    expect(result).toContain('idref="_chapter-01_xhtml"')
    expect(result).toContain('linear="yes"')
  })

  test('item() renders a non-linear itemref', () => {
    const result = Spine.item({
      fileName: 'sidebar.xhtml',
      extension: '.xhtml',
      linear: false,
    })
    expect(result).toContain('linear="no"')
  })

  test('items() renders a list of spine items', () => {
    const data = [
      { fileName: 'chapter-01.xhtml', extension: '.xhtml', linear: true },
      { fileName: 'chapter-02.xhtml', extension: '.xhtml', linear: true },
    ]
    const result = Spine.items(data)
    expect(result).toMatchSnapshot()
    expect(result).toContain('chapter-01_xhtml')
    expect(result).toContain('chapter-02_xhtml')
  })

  test('items() includes non-linear items on non-mobi builds', () => {
    state.build = 'epub'
    const data = [
      { fileName: 'aside.xhtml', extension: '.xhtml', linear: false },
    ]
    expect(Spine.items(data)).toContain('aside_xhtml')
  })

  test('items() omits non-linear items on mobi builds', () => {
    state.build = 'mobi'
    const data = [
      { fileName: 'aside.xhtml', extension: '.xhtml', linear: false },
    ]
    expect(Spine.items(data)).toBe('')
    state.build = 'epub'
  })

  test('items() appends loi items for figures-titlepage', () => {
    state.build = 'epub'
    state.loi = [
      { fileName: 'figures-loi-01.xhtml', extension: '.xhtml', linear: true },
    ]
    const data = [
      { fileName: 'figures-titlepage', extension: '.xhtml', linear: true },
    ]
    const result = Spine.items(data)
    expect(result).toContain('figures-titlepage_xhtml')
    expect(result).toContain('figures-loi-01_xhtml')
    state.loi = []
  })
})

describe('templates.Opf.Guide', () => {
  test('body() returns a Vinyl file with guide wrapper', () => {
    const file = Guide.body()
    expect(file.contents.toString()).toBe('<guide>{% body %}</guide>')
    expect(file.path).toBe('guide.body.tmpl')
  })

  test('item() renders a reference element', () => {
    const result = Guide.item({
      type: 'toc',
      title: 'Table of Contents',
      href: 'text/toc.xhtml',
    })
    expect(result).toMatchSnapshot()
    expect(result).toContain('type="toc"')
    expect(result).toContain('href="text/toc.xhtml"')
  })

  test('items() renders a list of guide references', () => {
    const data = [
      {
        type: 'toc',
        title: 'Table of Contents',
        fileName: 'toc.xhtml',
      },
      {
        type: 'cover',
        title: 'Cover',
        fileName: 'cover.xhtml',
      },
    ]
    expect(Guide.items(data)).toMatchSnapshot()
  })

  test('items() skips entries without a type', () => {
    const data = [
      { title: 'No Type', fileName: 'no-type.xhtml' },
      { type: 'toc', title: 'TOC', fileName: 'toc.xhtml' },
    ]
    const result = Guide.items(data)
    expect(result).toContain('type="toc"')
    expect(result).not.toContain('No Type')
  })
})
