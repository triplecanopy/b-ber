import fs from 'fs-extra'
import HtmlToXmlParser from '../src/HtmlToXml'

jest.mock('../src/Spine')
jest.mock('../src/SpineItem')

// State is imported at module level inside HtmlToXml; mkdirp ensures
// State.loadAudioVideo does not error on first access
beforeAll(() => fs.mkdirp('_project/_media'))
afterAll(() => Promise.all([fs.remove('_project'), fs.remove('themes')]))

function parse(content) {
  return new Promise(resolve => {
    new HtmlToXmlParser({ content, onEndCallback: resolve }).parse()
  })
}

describe('HtmlToXmlParser', () => {
  it('emits an XML declaration', async () => {
    const out = await parse('<p>hi</p>')
    expect(out).toContain(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    )
  })

  it('wraps output in a <body> element', async () => {
    const out = await parse('<p>hi</p>')
    expect(out).toContain('<body>')
    expect(out).toContain('</body>')
  })

  it('preserves basic block elements and text', async () => {
    const out = await parse('<div><p>Hello world</p></div>')
    expect(out).toContain('<div>')
    expect(out).toContain('<p>')
    expect(out).toContain('Hello world')
    expect(out).toContain('</p>')
    expect(out).toContain('</div>')
  })

  it('strips blacklisted tags (html, head, title, script)', async () => {
    const out = await parse(
      '<html><head><title>Ignored</title></head><body><p>Kept</p></body></html>'
    )
    expect(out).not.toContain('<html')
    expect(out).not.toContain('<head')
    expect(out).not.toContain('<title')
    expect(out).toContain('<p>')
    expect(out).toContain('Kept')
  })

  it('ignores <body> tags entirely (body is in blacklistedTagNames)', async () => {
    // The class-renaming branch in onopentag is unreachable because 'body'
    // is blacklisted; the outer <body> written by parse() is the only one
    const out = await parse('<body class="chapter"><p>text</p></body>')
    expect(out).not.toContain('<chapter>')
    expect(out).toContain('<p>')
  })

  it('renames a <div> with a custom element class (class attribute preserved)', async () => {
    const out = await parse('<div class="pullquote"><p>quote</p></div>')
    // The element is renamed to 'pullquote' but writeTagOpen keeps the class attr
    expect(out).toContain('</pullquote>')
    expect(out).toContain('class="pullquote"')
  })

  it('ignores whitespace-only text nodes', async () => {
    const out = await parse('<div>   </div>')
    // Whitespace-only text should not appear between tags
    expect(out).not.toMatch(/<div>\s+<\/div>/)
  })

  it('inserts a pagebreak for figure__large figure__inline elements', async () => {
    const out = await parse(
      '<div class="figure__large figure__inline"><p>fig</p></div>'
    )
    expect(out).toContain('<pagebreak>')
  })

  it('inserts a pagebreak for gallery__item elements', async () => {
    const out = await parse('<div class="gallery__item"><p>item</p></div>')
    expect(out).toContain('<pagebreak>')
  })

  it('skips <source> tags without .mp3/.mp4 src', async () => {
    const out = await parse('<source src="file.ogg">')
    expect(out).not.toContain('<source')
  })
})

describe('HtmlToXmlParser helper methods', () => {
  it('writeTagOpen builds a tag with whitelisted attributes', () => {
    const parser = new HtmlToXmlParser({ content: '', onEndCallback: () => {} })
    parser.writeTagOpen('p', { class: 'intro', id: 'skip-me' })
    // 'id' is not whitelisted; 'class' is
    expect(parser.output).toContain('<p class="intro">')
    expect(parser.output).not.toContain('id=')
  })

  it('writeTagClose appends a newline for block elements', () => {
    const parser = new HtmlToXmlParser({ content: '', onEndCallback: () => {} })
    parser.writeTagClose('p')
    expect(parser.output).toBe('</p>\n')
  })

  it('writeTagClose does not append a newline for inline elements', () => {
    const parser = new HtmlToXmlParser({ content: '', onEndCallback: () => {} })
    parser.writeTagClose('strong')
    expect(parser.output).toBe('</strong>')
  })

  it('addTag / removeTag / getTag manage a stack', () => {
    const parser = new HtmlToXmlParser({ content: '', onEndCallback: () => {} })
    expect(parser.getTag()).toBeNull()
    parser.addTag('div')
    parser.addTag('p')
    expect(parser.getTag()).toBe('p')
    expect(parser.removeTag()).toBe('p')
    expect(parser.getTag()).toBe('div')
  })

  it('renameAttribute returns the mapped name for known elements', () => {
    const parser = new HtmlToXmlParser({ content: '', onEndCallback: () => {} })
    expect(parser.renameAttribute('img', 'src')).toBe('href')
    expect(parser.renameAttribute('img', 'alt')).toBe('alt')
    expect(parser.renameAttribute('p', 'class')).toBe('class')
  })
})
