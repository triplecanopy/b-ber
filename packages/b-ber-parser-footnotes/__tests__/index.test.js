import MarkdownIt from 'markdown-it'
import footnotePlugin, { Counter } from '../src'

// The render's env: the document, with the book's numbering, and what the
// build has collected of it
const envFor = ({
  groupFootnotes = false,
  footnotes = new Counter(),
  footnotesBefore = 0,
} = {}) => ({
  document: { groupFootnotes, footnotes, footnotesBefore },
  result: { footnotes: [] },
})

// Renders as b-ber-grammar-footnotes does: the notes once the parse has them,
// collected into the document's result
const renderer = () => {
  const md = new MarkdownIt()
  footnotePlugin(md, (tokens, env) => {
    env.result.footnotes.push(md.renderer.render(tokens, md.options, env))
  })
  return md
}

describe('b-ber-parser-footnotes', () => {
  test('exports a function', () => {
    expect(typeof footnotePlugin).toBe('function')
  })

  test('registers on a markdown-it instance without throwing', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    expect(() => footnotePlugin(md, callback)).not.toThrow()
  })

  test('adds footnote_def block rule', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    const ruleNames = md.block.ruler.__rules__.map((r) => r.name)
    expect(ruleNames).toContain('footnote_def')
  })

  test('adds footnote inline rules', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    const inlineRuleNames = md.inline.ruler.__rules__.map((r) => r.name)
    expect(inlineRuleNames).toContain('footnote_inline')
    expect(inlineRuleNames).toContain('footnote_ref')
  })

  test('registers footnote renderer rules', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    expect(typeof md.renderer.rules.footnote_ref).toBe('function')
    expect(typeof md.renderer.rules.footnote_block_open).toBe('function')
    expect(typeof md.renderer.rules.footnote_block_close).toBe('function')
    expect(typeof md.renderer.rules.footnote_open).toBe('function')
    expect(typeof md.renderer.rules.footnote_close).toBe('function')
  })

  test('parses reference-style footnote definition', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    expect(() =>
      md.render(
        '[^1]: The footnote definition.\n\nText with a reference[^1].\n',
        envFor()
      )
    ).not.toThrow()
  })

  test('invokes callback with collected footnote tokens', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    md.render('[^note]: The definition.\n\nText with [^note].\n', envFor())
    expect(callback).toHaveBeenCalled()
  })

  test('parses inline footnote syntax ^[...]', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    expect(() =>
      md.render('Text with an inline footnote^[inline definition].\n', envFor())
    ).not.toThrow()
    expect(callback).toHaveBeenCalled()
  })

  test('renders footnote reference as epub:type=noteref anchor', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    const result = md.render('[^1]: definition\n\nText[^1].\n', envFor())
    expect(result).toContain('epub:type="noteref"')
    expect(result).toContain('footnote-ref')
  })

  test('renders footnote block open as ordered list', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    const callbackArg = []
    callback.mockImplementation((tokens) => callbackArg.push(...tokens))
    md.render('[^1]: definition\n\nText[^1].\n', envFor())
    const types = callbackArg.map((t) => t.type)
    expect(types).toContain('footnote_block_open')
  })

  test('footnote_def block rule returns false for non-footnote content', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    // Ordinary paragraph — footnote_def rule should not fire
    md.render('Just a regular paragraph.\n', envFor())
    expect(callback).not.toHaveBeenCalled()
  })

  test('footnote_ref rule returns false when no refs are registered', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    // [^1] reference without a definition — should not trigger footnote_ref
    md.render('Text with [^unknown] reference only.\n', envFor())
    expect(callback).not.toHaveBeenCalled()
  })

  // Under `group_footnotes: false` notes are numbered across the whole book:
  // the build makes one Counter and passes it to every document (TASK-177;
  // it was a module-level singleton)
  describe('book-wide numbering', () => {
    const chapter = 'One^[a] two^[b].\n'

    test('continues across the documents given one Counter', () => {
      const md = renderer()
      const footnotes = new Counter()
      const first = envFor({ footnotes })
      md.render(chapter, first)
      const second = envFor({ footnotes, footnotesBefore: 1 })
      const body = md.render(chapter, second)

      expect(first.result.footnotes[0]).toContain(
        '<ol class="footnotes" start="1">'
      )
      expect(second.result.footnotes[0]).toContain(
        '<ol class="footnotes" start="3">'
      )
      expect(body).toMatch(/>3<\/a>.*>4<\/a>/)
    })

    test('starts again with a new Counter', () => {
      const md = renderer()
      md.render(chapter, envFor())
      const next = envFor()
      md.render(chapter, next)
      expect(next.result.footnotes[0]).toContain('start="1"')
    })

    test('numbers each document from 1 when grouped', () => {
      const md = renderer()
      const footnotes = new Counter()
      md.render(chapter, envFor({ groupFootnotes: true, footnotes }))
      const second = envFor({
        groupFootnotes: true,
        footnotes,
        footnotesBefore: 1,
      })
      const body = md.render(chapter, second)
      expect(second.result.footnotes[0]).toContain('start="1"')
      expect(body).toMatch(/>1<\/a>.*>2<\/a>/)
    })
  })

  test('handles multiple footnote references to the same label', () => {
    const md = new MarkdownIt()
    const callback = jest.fn()
    footnotePlugin(md, callback)
    expect(() =>
      md.render(
        '[^a]: definition\n\nFirst[^a] and second[^a] reference.\n',
        envFor()
      )
    ).not.toThrow()
    expect(callback).toHaveBeenCalled()
  })
})
