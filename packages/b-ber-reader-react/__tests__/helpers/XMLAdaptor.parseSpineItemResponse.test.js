import React from 'react'
import * as Request from '../../src/helpers/Request'
import * as Url from '../../src/helpers/Url'
import XMLAdaptor from '../../src/helpers/XMLAdaptor'

jest.mock('../../src/helpers/Request')

const linkedCSS = '.linked { color: blue; background: url(../images/bg.png); }'
const inlineCSS = 'body { color: red; } html { margin: 0; }'

const fixtureHTML = `<!doctype html>
<html>
<head>
<link rel="stylesheet" type="text/css" href="../css/style.css" />
<style>${inlineCSS}</style>
</head>
<body>
<p>Hello <a href="../text/chapter-2.xhtml">world</a></p>
<img src="../images/figure.png" alt="a figure" />
</body>
</html>`

const responseURL = 'http://localhost/OPS/text/chapter-1.xhtml'

const baseResponse = {
  data: fixtureHTML,
  request: { url: responseURL },
  hash: 'abc123',
  opsURL: 'http://localhost/OPS',
  paddingLeft: 0,
  columnGap: 0,
  requestedSpineItem: { absoluteURL: responseURL },
}

beforeEach(() => {
  Request.getText.mockResolvedValue({ data: linkedCSS })
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('XMLAdaptor.parseSpineItemResponse', () => {
  test('returns bookContent and scopedCSS', async () => {
    const result = await XMLAdaptor.parseSpineItemResponse(baseResponse)

    expect(result).toHaveProperty('bookContent')
    expect(result).toHaveProperty('scopedCSS')

    // parseWithInstructions may return a single element or an array of nodes
    const content = Array.isArray(result.bookContent)
      ? result.bookContent
      : [result.bookContent]

    expect(content.length).toBeGreaterThan(0)
    content.forEach((node) => {
      const isElementOrText =
        React.isValidElement(node) || typeof node === 'string'
      expect(isElementOrText).toBe(true)
    })
  })

  test('fetches linked stylesheet from resolved absolute URL', async () => {
    await XMLAdaptor.parseSpineItemResponse(baseResponse)

    const expectedBase = Url.trimFilenameFromResponse(responseURL)
    const expectedURL = Url.resolveRelativeURL(
      expectedBase,
      Url.trimSlashes('../css/style.css')
    )

    expect(Request.getText).toHaveBeenCalledWith(expectedURL)
  })

  test('scopedCSS includes scoped class name and content from both stylesheets', async () => {
    const { scopedCSS } = await XMLAdaptor.parseSpineItemResponse(baseResponse)

    expect(typeof scopedCSS).toBe('string')
    expect(scopedCSS.length).toBeGreaterThan(0)

    // hashed scope class name
    expect(scopedCSS).toContain('_abc123')

    // content from the linked stylesheet
    expect(scopedCSS).toContain('.linked')
    expect(scopedCSS).toContain('color:blue')

    // content from the inline <style> element
    expect(scopedCSS).toContain('color:red')

    // html selector rewritten to scope class
    expect(scopedCSS).toContain('._abc123')

    // body selector rewritten to #content
    expect(scopedCSS).toContain('#content')
  })
})

describe('XMLAdaptor.createScopedCSS', () => {
  const scope = '_hash1'
  const opsURL = 'http://localhost/OPS'

  test('rewrites html type selector to scope class selector', () => {
    const sheets = [
      { base: 'http://localhost/OPS/text/', data: 'html { margin: 0; }' },
    ]
    const css = XMLAdaptor.createScopedCSS(sheets, scope, opsURL)

    expect(css).toContain(`._${scope.replace(/^_/, '')}`)
    expect(css).not.toMatch(/(^|\s)html\s*\{/)
  })

  test('rewrites body type selector to #content id selector', () => {
    const sheets = [
      { base: 'http://localhost/OPS/text/', data: 'body { color: red; }' },
    ]
    const css = XMLAdaptor.createScopedCSS(sheets, scope, opsURL)

    expect(css).toContain('#content')
    expect(css).not.toMatch(/(^|\s)body\s*\{/)
  })

  test('prepends scope class to other selectors that do not already start with it', () => {
    const sheets = [
      {
        base: 'http://localhost/OPS/text/',
        data: '.foo { color: green; } #bar { color: blue; } [data-x] { color: yellow; }',
      },
    ]
    const css = XMLAdaptor.createScopedCSS(sheets, scope, opsURL)

    expect(css).toContain(`${scope} .foo`)
    expect(css).toContain(`${scope} #bar`)
    expect(css).toContain(`${scope} [data-x]`)
  })

  test('does not re-prepend scope class to selectors already starting with it', () => {
    const sheets = [
      {
        base: 'http://localhost/OPS/text/',
        data: `${scope} .foo { color: green; }`,
      },
    ]
    const css = XMLAdaptor.createScopedCSS(sheets, scope, opsURL)

    // Should only have one occurrence of the scope class name in the selector
    const matches = css.match(new RegExp(scope.replace(/^_/, '\\_'), 'g'))
    expect(matches).toHaveLength(1)
  })

  test('resolves relative url() values against the stylesheet base', () => {
    const base = 'http://localhost/OPS/css/'
    const sheets = [
      { base, data: '.bg { background: url(../images/bg.png); }' },
    ]
    const css = XMLAdaptor.createScopedCSS(sheets, scope, opsURL)

    const expectedURL = Url.resolveRelativeURL(base, '../images/bg.png')
    expect(css).toContain(expectedURL)
  })

  test('leaves absolute url() values unchanged', () => {
    const base = 'http://localhost/OPS/css/'
    const absoluteURL = 'http://example.com/images/bg.png'
    const sheets = [{ base, data: `.bg { background: url(${absoluteURL}); }` }]
    const css = XMLAdaptor.createScopedCSS(sheets, scope, opsURL)

    expect(css).toContain(absoluteURL)
  })

  test('concatenates output from multiple sheets', () => {
    const sheets = [
      { base: 'http://localhost/OPS/css/', data: '.one { color: red; }' },
      { base: 'http://localhost/OPS/css/', data: '.two { color: blue; }' },
    ]
    const css = XMLAdaptor.createScopedCSS(sheets, scope, opsURL)

    expect(css).toContain('.one')
    expect(css).toContain('.two')
  })
})
