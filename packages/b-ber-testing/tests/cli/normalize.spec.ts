// What the golden-output normalizer (TASK-152) hides, and what it must not.
// No build: these run in milliseconds

import { expect, test } from '@playwright/test'
import { createNormalizer, isReaderAppAsset, isText } from './golden/normalize'

test.describe('golden normalizer', () => {
  test('replaces the fixture path, the longest root first', () => {
    const n = createNormalizer(['/tmp/x', '/private/tmp/x'])
    expect(n.text('a.xhtml', 'href="/private/tmp/x/OPS" src="/tmp/x/a"')).toBe(
      'href="{fixture}/OPS" src="{fixture}/a"'
    )
  })

  test('replaces timestamps and the generator version', () => {
    const n = createNormalizer([])
    expect(
      n.text(
        'a.opf',
        '<meta property="dcterms:modified">2026-11-15T02:43:24Z</meta>'
      )
    ).toBe('<meta property="dcterms:modified">{timestamp}</meta>')
    expect(n.text('a.xml', 'b-ber@4.0.3 and 2026-11-15T02:43:26.924Z')).toBe(
      'b-ber@{version} and {timestamp}'
    )
  })

  test('leaves a date without a time alone', () => {
    expect(createNormalizer([]).text('a.xhtml', '2020-01-15')).toBe(
      '2020-01-15'
    )
  })

  test('numbers random ids consistently across the files of one build', () => {
    const n = createNormalizer([])
    expect(n.text('ch.xhtml', 'href="notes.xhtml#fn-1-b532308b3e637b23"')).toBe(
      'href="notes.xhtml#fn-1-{id:1}"'
    )
    expect(n.text('notes.xhtml', 'id="fn-1-b532308b3e637b23"')).toBe(
      'id="fn-1-{id:1}"'
    )
    expect(n.text('a.xhtml', 'id="_f6cca3820e4f6eb3"')).toBe('id="_{id:2}"')
  })

  test('leaves the 40-character cover image hash alone', () => {
    const name = '__bber_cover__d0dc481a9caadda380523127fc70bc147cd84696.jpg'
    expect(createNormalizer([]).text('a.xhtml', name)).toBe(name)
  })

  test("replaces Vite's content hash in reader asset paths", () => {
    expect(
      createNormalizer([]).text('index.html', 'src="/assets/index-DNrfVkB9.js"')
    ).toBe('src="/assets/index-{hash}.js"')
  })

  test('puts OPF elements on their own lines and sorts only the manifest', () => {
    const opf =
      '<package><manifest><item id="b"/><item id="a"/></manifest>' +
      '<spine><itemref idref="b"/><itemref idref="a"/></spine></package>'
    expect(createNormalizer([]).text('content.opf', opf)).toBe(
      [
        '<package>',
        '<manifest>',
        '<item id="a"/>',
        '<item id="b"/>',
        '</manifest>',
        '<spine>',
        '<itemref idref="b"/>',
        '<itemref idref="a"/>',
        '</spine>',
        '</package>',
      ].join('\n')
    )
  })

  test('sorts the search index by URL and drops its numbering', () => {
    const index = JSON.stringify([
      { id: 0, title: 'B', body: '', url: '/text/b.xhtml' },
      { id: 1, title: 'A', body: '', url: '/text/a.xhtml' },
    ])
    expect(
      JSON.parse(createNormalizer([]).text('search-index.json', index))
    ).toEqual([
      { id: '{id}', title: 'A', body: '', url: '/text/a.xhtml' },
      { id: '{id}', title: 'B', body: '', url: '/text/b.xhtml' },
    ])
  })

  test("sorts a manifest's resources but not its reading order", () => {
    const manifest = JSON.stringify({
      readingOrder: [{ href: 'b' }, { href: 'a' }],
      resources: [{ href: 'b' }, { href: 'a' }],
    })
    expect(
      JSON.parse(createNormalizer([]).text('manifest.json', manifest))
    ).toEqual({
      readingOrder: [{ href: 'b' }, { href: 'a' }],
      resources: [{ href: 'a' }, { href: 'b' }],
    })
  })

  test('compares generated text as text, and the rest by hash', () => {
    expect(isText('OPS/text/a.xhtml', 100)).toBe(true)
    expect(isText('mimetype', 20)).toBe(true)
    expect(isText('OPS/images/a.png', 100)).toBe(false)
    expect(isText('lunr.js', 100 * 1024)).toBe(false)
  })

  test("records only that the reader app's bundle is there", () => {
    expect(isReaderAppAsset('reader', 'assets/index-DNrfVkB9.js')).toBe(true)
    expect(isReaderAppAsset('reader', 'epub/x/OPS/a.xhtml')).toBe(false)
    expect(isReaderAppAsset('web', 'assets/a.js')).toBe(false)
  })
})
