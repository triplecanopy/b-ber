import { h, serialize } from '../src/xhtml'

describe('xhtml', () => {
  it('writes an element with its attributes in order, and its children', () => {
    const node = h('section', { id: 'a', class: 'b c' }, [
      h('p', null, ['text']),
    ])
    expect(serialize(node)).toBe(
      '<section id="a" class="b c"><p>text</p></section>'
    )
  })

  it('takes attributes as pairs, and leaves out null, undefined and false', () => {
    expect(
      serialize(
        h('div', [
          ['data-a', '1'],
          ['data-b', 2],
        ])
      )
    ).toBe('<div data-a="1" data-b="2"></div>')
    expect(
      serialize(h('div', { a: null, b: undefined, c: false, d: '' }))
    ).toBe('<div d=""></div>')
  })

  it('escapes attribute values as Html.escape does, and text', () => {
    expect(serialize(h('a', { title: `<"&'>` }, ['a < b & c > d "e"']))).toBe(
      '<a title="&lt;&quot;&amp;&#39;&gt;">a &lt; b &amp; c &gt; d "e"</a>'
    )
  })

  it('closes a void element itself, and never another element', () => {
    expect(serialize(h('img', { src: 'a.png', alt: '' }))).toBe(
      '<img src="a.png" alt=""/>'
    )
    expect(serialize(h('iframe', { src: 'x' }))).toBe(
      '<iframe src="x"></iframe>'
    )
  })

  it('writes raw markup as it is, and skips children that are not there', () => {
    const node = h('div', null, [
      h.raw('<em>a</em>'),
      null,
      false,
      undefined,
      'b',
    ])
    expect(serialize(node)).toBe('<div><em>a</em>b</div>')
  })

  it('writes a fragment’s children one after another', () => {
    expect(serialize(h.fragment(['\n', h('br'), h.text('&')]))).toBe(
      '\n<br/>&amp;'
    )
  })

  it('writes a comment, with no `--` inside it', () => {
    expect(serialize(h.comment('START: a#b'))).toBe('<!-- START: a#b -->')
    expect(serialize(h.comment('a--b---c'))).toBe('<!-- a- -b- - -c -->')
  })
})
