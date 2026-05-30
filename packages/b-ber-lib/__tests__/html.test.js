import Html from '../src/Html'

describe('Html.comment', () => {
  it('wraps a string in an HTML comment with surrounding newlines', () => {
    expect(Html.comment('hello')).toBe('\n<!-- hello -->\n')
  })
})

describe('Html.escape', () => {
  it('escapes &', () => {
    expect(Html.escape('a&b')).toBe('a&amp;b')
  })

  it('escapes <', () => {
    expect(Html.escape('a<b')).toBe('a&lt;b')
  })

  it('escapes >', () => {
    expect(Html.escape('a>b')).toBe('a&gt;b')
  })

  it('escapes double quotes', () => {
    expect(Html.escape('"quoted"')).toBe('&quot;quoted&quot;')
  })

  it('escapes single quotes', () => {
    expect(Html.escape("it's")).toBe('it&#39;s')
  })

  it('escapes all special characters in a string', () => {
    expect(Html.escape('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('leaves safe strings unchanged', () => {
    expect(Html.escape('hello world')).toBe('hello world')
  })

  it('coerces non-string input to string before escaping', () => {
    expect(Html.escape(42)).toBe('42')
    expect(Html.escape(null)).toBe('null')
  })
})
