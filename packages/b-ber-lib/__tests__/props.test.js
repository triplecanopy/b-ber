import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import ManifestItemProperties from '../src/ManifestItemProperties'

jest.mock('../src/Spine')
jest.mock('../src/SpineItem')

let tmpDir
let xhtmlFile
let navFile
let scriptFile
let svgFile
let txtFile

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'b-ber-lib-props-'))

  const write = async (name, content) => {
    const absolutePath = path.join(tmpDir, name)
    await fs.writeFile(absolutePath, content, 'utf8')
    return { absolutePath, name }
  }

  xhtmlFile = await write(
    'chapter.xhtml',
    '<html><body><p>text</p></body></html>'
  )
  navFile = await write('toc.xhtml', '<html><body><nav>TOC</nav></body></html>')
  scriptFile = await write(
    'script.xhtml',
    '<html><body><script>var x;</script></body></html>'
  )
  svgFile = await write('svg.xhtml', '<html><body><svg></svg></body></html>')
  txtFile = await write('file.txt', 'not html')
})

afterAll(() => fs.remove(tmpDir))

describe('ManifestItemProperties.isHTML', () => {
  it('returns true for an xhtml file', () => {
    expect(ManifestItemProperties.isHTML(xhtmlFile)).toBe(true)
  })

  it('returns false for a non-html file', () => {
    expect(ManifestItemProperties.isHTML(txtFile)).toBe(false)
  })
})

describe('ManifestItemProperties.isNav', () => {
  it('returns true for toc.xhtml', () => {
    expect(ManifestItemProperties.isNav(navFile)).toBe(true)
  })

  it('returns false for a non-nav xhtml file', () => {
    expect(ManifestItemProperties.isNav(xhtmlFile)).toBe(false)
  })
})

describe('ManifestItemProperties.isScripted', () => {
  it('returns true for an xhtml file containing <script>', () => {
    expect(ManifestItemProperties.isScripted(scriptFile)).toBe(true)
  })

  it('returns true for nav files (scripted by convention)', () => {
    expect(ManifestItemProperties.isScripted(navFile)).toBe(true)
  })

  it('returns false for xhtml without script', () => {
    expect(ManifestItemProperties.isScripted(xhtmlFile)).toBe(false)
  })

  it('returns false for non-html files', () => {
    expect(ManifestItemProperties.isScripted(txtFile)).toBe(false)
  })
})

describe('ManifestItemProperties.isSVG', () => {
  it('returns true for an xhtml file containing <svg>', () => {
    expect(ManifestItemProperties.isSVG(svgFile)).toBe(true)
  })

  it('returns false for xhtml without svg', () => {
    expect(ManifestItemProperties.isSVG(xhtmlFile)).toBe(false)
  })

  it('returns false for non-html files', () => {
    expect(ManifestItemProperties.isSVG(txtFile)).toBe(false)
  })
})

describe('ManifestItemProperties.isDCElement', () => {
  it('returns true for known Dublin Core elements', () => {
    expect(ManifestItemProperties.isDCElement({ term: 'title' })).toBe(true)
    expect(ManifestItemProperties.isDCElement({ term: 'creator' })).toBe(true)
  })

  it('returns false for unknown terms', () => {
    expect(ManifestItemProperties.isDCElement({ term: 'notafield' })).toBe(
      false
    )
  })

  it('returns false when the term property is absent', () => {
    expect(ManifestItemProperties.isDCElement({ other: 'title' })).toBe(false)
  })
})

describe('ManifestItemProperties.isDCTerm', () => {
  it('returns true for known Dublin Core terms', () => {
    expect(ManifestItemProperties.isDCTerm({ term: 'abstract' })).toBe(true)
    expect(ManifestItemProperties.isDCTerm({ term: 'title' })).toBe(true)
  })

  it('returns false for unknown terms', () => {
    expect(ManifestItemProperties.isDCTerm({ term: 'notafield' })).toBe(false)
  })

  it('returns false when the term property is absent', () => {
    expect(ManifestItemProperties.isDCTerm({ value: 'abstract' })).toBe(false)
  })
})

describe('ManifestItemProperties.testHTML', () => {
  it('returns ["nav", "scripted"] for a nav xhtml file', () => {
    const props = ManifestItemProperties.testHTML(navFile)
    expect(props).toContain('nav')
    expect(props).toContain('scripted')
  })

  it('returns ["scripted"] for a scripted non-nav file', () => {
    const props = ManifestItemProperties.testHTML(scriptFile)
    expect(props).toContain('scripted')
    expect(props).not.toContain('nav')
  })

  it('returns ["svg"] for a file containing svg', () => {
    const props = ManifestItemProperties.testHTML(svgFile)
    expect(props).toContain('svg')
  })

  it('returns empty array for a plain xhtml file', () => {
    expect(ManifestItemProperties.testHTML(xhtmlFile)).toEqual([])
  })
})

describe('ManifestItemProperties.testMeta', () => {
  it('returns {term: true, element: true} for a Dublin Core element', () => {
    const result = ManifestItemProperties.testMeta({ term: 'title' })
    expect(result.element).toBe(true)
    expect(result.term).toBe(true)
  })

  it('returns {term: false, element: false} for an unknown term', () => {
    const result = ManifestItemProperties.testMeta({ term: 'unknown' })
    expect(result.element).toBe(false)
    expect(result.term).toBe(false)
  })
})
