import path from 'node:path'
import fs from 'fs-extra'
import { getTarget } from '../../b-ber-lib/src/Target'

// State singleton initialises in its constructor and checks for the media dir.
// Create the required directories before any module is imported.
let markdownRenderer
let createFootnoteNumbering

beforeAll(async () => {
  // State initialises in its constructor and tries to load _project/toc.yml
  // via Spine. Create the minimum project structure needed for State to start.
  await fs.mkdirp('_project/_media')
  await fs.writeFile('_project/toc.yml', '[]\n', 'utf8')
  // Defer import so State initialises after the directories exist
  // eslint-disable-next-line global-require
  markdownRenderer = require('../src').default
  ;({ createFootnoteNumbering } = require('../src'))
})

afterAll(() => Promise.all([fs.remove('_project'), fs.remove('themes')]))

describe('b-ber-markdown-renderer', () => {
  it('exports a renderer singleton', () => {
    expect(typeof markdownRenderer).toBe('object')
    expect(markdownRenderer).not.toBeNull()
  })

  it('exposes a render() method', () => {
    expect(typeof markdownRenderer.render).toBe('function')
  })

  it('exposes a template() method', () => {
    expect(typeof markdownRenderer.template).toBe('function')
  })

  it('has a markdownIt instance', () => {
    expect(markdownRenderer.markdownIt).toBeDefined()
    expect(typeof markdownRenderer.markdownIt.render).toBe('function')
  })

  it('template() formats YAML front matter with two-space indent', () => {
    const result = markdownRenderer.template(
      'title: Hello\nauthor: World',
      'chapter-01'
    )
    expect(result).toContain('  title: Hello')
    expect(result).toContain('  author: World')
    expect(result.startsWith('-\n')).toBe(true)
  })

  it('template() includes the fileName in the output', () => {
    const result = markdownRenderer.template('title: Test', 'chapter-01')
    expect(result).toContain('fileName: chapter-01')
  })

  it('render() converts a plain paragraph to HTML', () => {
    const result = markdownRenderer.render('test.md', 'Hello world.\n')
    expect(result).toContain('Hello world.')
    expect(result).toContain('<p>')
  })

  // The file was kept on the instance until TASK-177, and every grammar read
  // it from there
  it('render() keeps nothing of the document on the instance', () => {
    markdownRenderer.render('my-chapter', 'Some text.\n')
    expect(markdownRenderer.fileName).toBeUndefined()
  })

  it('render() gives the document to the grammars in env', () => {
    const env = {}
    markdownRenderer.render(
      'my-chapter',
      '::: chapter:c\n\nx\n\n::: exit:c\n',
      env
    )
    expect(env.document).toMatchObject({
      fileName: 'my-chapter',
      title: 'my-chapter',
    })
    expect(env.result).toEqual({
      figures: [],
      footnotes: [],
      guide: [],
      frontMatter: [],
      remoteAssets: [],
    })
  })

  it('render() handles a heading', () => {
    const result = markdownRenderer.render('test.md', '# Chapter One\n')
    expect(result).toContain('<h1>')
    expect(result).toContain('Chapter One')
  })

  it('render() handles inline code', () => {
    const result = markdownRenderer.render('test.md', 'Call `foo()` here.\n')
    expect(result).toContain('<code>')
  })

  it('render() handles empty string input', () => {
    const result = markdownRenderer.render('test.md', '')
    expect(typeof result).toBe('string')
  })
})

// A document of an epub, the first of its book, as the build describes it
const documentFor = (fileName) => ({
  fileName,
  title: fileName,
  target: getTarget('epub'),
  images: (name) => path.join('_project', '_images', name),
  audio: [],
  video: [],
  media: {},
  groupFootnotes: true,
  figuresBefore: 0,
  footnotesBefore: 0,
  footnotes: createFootnoteNumbering(),
})

// Footnote refs carry a random 16-hex-digit suffix (parser-footnotes Counter)
const stableIds = (html) => html.replace(/-[0-9a-f]{16}\b/g, '-<ID>')

// Locks the exact XHTML that the whole plugin stack produces. The snapshot was
// recorded on markdown-it 15 and checked byte-for-byte against markdown-it 8
// (TASK-144), so a change here is a change in what authors' books contain.
describe('b-ber-markdown-renderer output', () => {
  const source = fs.readFileSync(
    path.join(__dirname, 'fixtures/document.md'),
    'utf8'
  )
  it('renders the fixture document', () => {
    const html = markdownRenderer.render('rendering-fixture', source)
    expect(stableIds(html)).toMatchSnapshot()
  })

  // `epigraph` is a structural block, handled by grammar-section. The
  // standalone `::: epigraph caption "…"` form was retired with
  // b-ber-grammar-epigraph (TASK-145): it was never registered and rendered
  // as literal text, which no snapshot caught
  it('renders a block epigraph as an EPUB epigraph section', () => {
    const html = markdownRenderer.render(
      'epigraph-fixture',
      '::: epigraph:e1\n\nThe beginning.\n\nPlato\n\n::: exit:e1\n'
    )
    expect(html).toContain('epub:type="frontmatter epigraph"')
    expect(html).toContain('<p>The beginning.</p>')
    expect(html).not.toContain(':::')
  })

  it('collects the fixture document footnotes', () => {
    const { footnotes } = markdownRenderer.renderDocument(
      { ...documentFor('rendering-fixture') },
      source
    )
    expect(footnotes).toHaveLength(1)
    expect(stableIds(footnotes[0].notes)).toMatchSnapshot()
  })

  // What the build reads back from a document's render, which it kept in
  // State as each grammar met it until TASK-177
  it('returns what the fixture document collects', () => {
    const rendered = markdownRenderer.renderDocument(
      documentFor('rendering-fixture'),
      source
    )
    expect(stableIds(rendered.html)).toBe(
      stableIds(markdownRenderer.render('rendering-fixture', source))
    )
    expect(rendered.guide).toEqual([
      expect.objectContaining({ fileName: 'rendering-fixture' }),
    ])
    expect(rendered.frontMatter).toHaveLength(1)
    expect(rendered.diagnostics).toEqual(expect.any(Array))
  })
})

// Every block goes through the directive rule (TASK-174, TASK-175), which
// throws today's errors for the build
describe('b-ber-markdown-renderer: blocks', () => {
  // TASK-153 pinned the opposite: markdown-it asks a block rule in silent
  // mode whether it can interrupt a paragraph, and b-ber-parser-section
  // recorded the id then, so the real pass found its own id a duplicate.
  // The directive rule records nothing in silent mode
  it('renders a section straight after a paragraph line', () => {
    const html = markdownRenderer.render(
      'test',
      'para\n::: section:b\n\nbody\n\n::: exit:b\n'
    )
    expect(html).toContain('<p>para</p>')
    expect(html).toContain('<section id="b"')
    expect(html).toContain('<p>body</p>')
  })

  // b-ber-grammar-renderer's `validateOpen` recorded dialogue, gallery and
  // spread ids in silent mode too, so these threw `Duplicate [id]` until
  // TASK-175
  it.each([
    ['dialogue', '<section id="b"'],
    ['gallery', '<section id="b"'],
    ['spread', '<section id="b"'],
  ])('renders a %s straight after a paragraph line', (name, open) => {
    const html = markdownRenderer.render(
      'test',
      `para\n::: ${name}:b\n\nbody\n\n::: exit:b\n`
    )
    expect(html).toContain('<p>para</p>')
    expect(html).toContain(open)
    expect(html).toContain('<p>body</p>')
  })

  // A gallery's tokens hold the rest of its range, and a gallery item
  // anywhere after it used to become an image too (TASK-161)
  it('leaves a gallery item after the gallery’s exit as text', () => {
    const html = markdownRenderer.render(
      'test',
      '::: gallery:g\n\n:: type:image source:a.png item:1 ::\n\n::: exit:g\n\n:: type:image source:b.png item:2 ::\n'
    )
    expect(html).toContain('data-gallery-item="1"')
    expect(html).not.toContain('data-gallery-item="2"')
    expect(html).toContain('<p>:: type:image source:b.png item:2 ::</p>')
  })

  // TASK-161: an exit that closes nothing used to crash b-ber-grammar-pullquote
  // when no pullquote was open (`international-art-english-e-book`), and close
  // the open one when its id began with the exit's (`the-world-is-unknown`)
  describe('an exit that closes nothing', () => {
    it('is ignored when no block is open', () => {
      expect(
        markdownRenderer.render(
          'test',
          'Before.\n\n::: exit:nothing\n\nAfter.\n'
        )
      ).toBe('<p>Before.</p>\n<p>After.</p>\n')
    })

    it('does not close the open blockquote', () => {
      const html = markdownRenderer.render(
        'test',
        '::: blockquote:q\n\nA.\n\n::: exit:qq\n\nB.\n\n::: exit:q\n\nC.\n'
      )
      expect((html.match(/<\/blockquote>/g) ?? []).length).toBe(1)
      expect(html.indexOf('</blockquote>')).toBeGreaterThan(html.indexOf('B.'))
      expect(html.indexOf('</blockquote>')).toBeLessThan(html.indexOf('C.'))
    })
  })

  // TASK-161: a block an outer `exit` crossed, and a pullquote left open,
  // used to be left unclosed in the output
  describe('balanced output', () => {
    const count = (html, re) => (html.match(re) ?? []).length

    it('closes a block a crossed exit closes, before the outer block', () => {
      const html = markdownRenderer.render(
        'test',
        '::: chapter:a\n\n::: section:b\n\nInside.\n\n::: exit:a\n\nAfter.\n'
      )
      expect(count(html, /<section/g)).toBe(2)
      expect(count(html, /<\/section>/g)).toBe(2)
      const closeB = html.indexOf('END: section:exit#b')
      const closeA = html.indexOf('END: section:exit#a')
      expect(closeB).toBeGreaterThan(html.indexOf('Inside.'))
      expect(closeB).toBeLessThan(closeA)
      expect(closeA).toBeLessThan(html.indexOf('After.'))
    })

    // The i26 title pages leave a subchapter open inside a spread and close
    // it with the spread's exit
    it('closes a subchapter left open inside a spread at the spread’s exit', () => {
      const html = markdownRenderer.render(
        'test',
        '::: spread:s\n\n::: subchapter:x\n\nInside.\n\n::: exit:s\n\nAfter.\n'
      )
      expect(count(html, /<section/g)).toBe(count(html, /<\/section>/g))
      const closeX = html.indexOf('END: section:exit#x')
      expect(closeX).toBeGreaterThan(html.indexOf('Inside.'))
      expect(closeX).toBeLessThan(html.indexOf('END: section:exit#s'))
    })

    it.each([
      ['a chapter with attributes', '::: chapter:c classes:x'],
      ['a dialogue', '::: dialogue:c'],
    ])('closes %s left open at the end of the file', (_label, opener) => {
      const html = markdownRenderer.render('test', `${opener}\n\nText.\n`)
      expect(count(html, /<section/g)).toBe(1)
      expect(count(html, /<\/section>/g)).toBe(1)
      expect(html).toContain('END: section:#c')
    })

    it('closes a pullquote left open at the end of the file', () => {
      const html = markdownRenderer.render(
        'test',
        '::: pullquote:p citation:"Someone"\n\nQuoted.\n'
      )
      expect(count(html, /<section/g)).toBe(1)
      expect(count(html, /<\/section>/g)).toBe(1)
      expect(html).toContain('<cite>&#8212;&#160;Someone</cite>')
    })

    // TASK-174's quirk 2: `exit` was matched anywhere in an opener's line. A
    // structural block drew a stray close and its contents (or failed with a
    // TypeError), and a pullquote drew neither its open nor its close
    it.each([
      ['a chapter', '::: chapter:c title:"exit:here"', '<section id="c"'],
      ['a pullquote', '::: pullquote:c citation:"the exit"', '<section'],
    ])(
      'opens %s whose opener has `exit` in its line',
      (_label, opener, open) => {
        const html = markdownRenderer.render(
          'test',
          `${opener}\n\nText.\n\n::: exit:c\n`
        )
        expect(html).toContain(open)
        expect(count(html, /<section/g)).toBe(1)
        expect(count(html, /<\/section>/g)).toBe(1)
        expect(html.indexOf('<section')).toBeLessThan(html.indexOf('Text.'))
      }
    )
  })

  // TASK-175: a block opened in a list item used to take the rest of the
  // document with it. markdown-it ends the item where the indentation drops,
  // but the rule reported every line to the end of the file as consumed, so
  // the later items, the text after the list and the rest of the file
  // vanished, even with the exit inside the item
  describe('a block inside a list item', () => {
    const after = ['Second item.', 'After the list.', 'The last paragraph.']

    it.each([
      ['with its exit inside the item', '    ::: exit:q1\n'],
      ['with no exit', ''],
    ])('loses nothing after it, %s', (_label, exit) => {
      const html = markdownRenderer.render(
        'test',
        `::: chapter:c1\n- First item.\n\n  ::: pullquote:q1\n  A quote inside the list item.\n${exit.replace(/^ {4}/, '  ')}\n- Second item.\n\nAfter the list.\n::: exit:c1\nThe last paragraph.\n`
      )
      for (const text of after) expect(html).toContain(text)
      expect(html.indexOf('A quote inside the list item.')).toBeLessThan(
        html.indexOf('Second item.')
      )
      // The pullquote closes inside the first item, at its exit or at the
      // item's end
      expect(html.indexOf('END: section:pullquote#q1')).toBeLessThan(
        html.indexOf('Second item.')
      )
    })
  })

  // A `media` line is resolved for the target when it renders. A pre-pass
  // used to splice the replacement into the Markdown before the parse, per
  // target, and rewrote it inside fenced code too (TASK-175)
  describe('media', () => {
    const media = {
      m: {
        epub: {
          type: 'iframe',
          source: 'https://example.com/e',
          caption: 'Cap',
        },
        web: { type: 'iframe', source: 'https://example.com/w' },
      },
      s: { epub: { type: 'soundcloud', source: 'x' } },
    }
    // media.yml, and the target being built
    const renderFor = (build, src) =>
      markdownRenderer.render('test', src, {
        document: { target: getTarget(build), media },
      })

    it.each([
      [
        'epub',
        '::: iframe-inline:m source:"https://example.com/e"\n:: Cap\n::\n',
      ],
      ['web', '::: iframe-inline:m source:"https://example.com/w"\n'],
    ])('renders as the directive media.yml names for %s', (build, written) => {
      expect(renderFor(build, '::: media-inline:m\n')).toBe(
        renderFor(build, written)
      )
    })

    // Books write the caption under the line for the targets whose media.yml
    // entry has none
    it('takes the caption written under the line when media.yml has none', () => {
      expect(renderFor('web', '::: media-inline:m\n:: Written\n::\n')).toBe(
        renderFor(
          'web',
          '::: iframe-inline:m source:"https://example.com/w"\n:: Written\n::\n'
        )
      )
    })

    // The pre-pass wrote media.yml's caption into the Markdown, which left the
    // written one as text after the directive
    it('uses media.yml’s caption when it has one, leaving the written one as text', () => {
      const html = renderFor('epub', '::: media-inline:m\n:: Written\n::\n')
      expect(html).toBe(
        renderFor(
          'epub',
          '::: iframe-inline:m source:"https://example.com/e"\n:: Cap\n::\n\n:: Written\n::\n'
        )
      )
      expect(html).toContain('<p>:: Written\n::</p>')
    })

    it('is code inside fenced code', () => {
      expect(renderFor('epub', '```\n::: media-inline:m\n```\n')).toBe(
        '<pre><code>::: media-inline:m\n</code></pre>\n'
      )
    })

    it('renders a type no grammar claims as text, as it did', () => {
      expect(renderFor('epub', '::: media:s\n')).toBe(
        '<p>::: soundcloud:s source:&quot;x&quot;</p>\n'
      )
    })

    it('throws for an id media.yml lacks', () => {
      expect(() => renderFor('epub', '::: media:zzz\n')).toThrow(
        'Missing ID [zzz] in media.yml.'
      )
    })
  })

  it('still throws on a real duplicate id', () => {
    expect(() =>
      markdownRenderer.render(
        'test',
        '::: chapter:a\n\n::: exit:a\n\n::: section:a\n\n::: exit:a\n'
      )
    ).toThrow('Duplicate [id] [a]. [id] must be unique at [test.md:5]')
  })

  it('still throws on a block with no id', () => {
    expect(() =>
      markdownRenderer.render('test', 'para\n::: chapter\n')
    ).toThrow('Missing [id] for [chapter:start] at test.md:2')
  })

  it('reports diagnostics to env, with the file', () => {
    const env = { diagnostics: [] }
    markdownRenderer.render(
      'test',
      '::: chapter:a\n\n::: section:b\n\n::: exit:a\n',
      env
    )
    expect(env.diagnostics).toMatchObject([
      { code: 'crossed-exit', file: '_markdown/test.md' },
    ])
  })
})

// CommonMark corrections between markdown-it 8 and 15 that an author could
// plausibly hit. None occur in the kitchen-sink or demo projects (TASK-144).
describe('b-ber-markdown-renderer: changes from markdown-it 8', () => {
  const render = (md) => markdownRenderer.render('test.md', md)

  it('keeps runs of spaces inside code spans (8 collapsed them)', () => {
    expect(render('Use `a  b` here.')).toBe(
      '<p>Use <code>a  b</code> here.</p>\n'
    )
  })

  it('allows emphasis inside a word with *** (8 left it literal)', () => {
    expect(render('foo***bar***baz')).toBe(
      '<p>foo<em><strong>bar</strong></em>baz</p>\n'
    )
  })

  it('passes an inline comment containing -- through raw (8 escaped it)', () => {
    // Block-level comments were already passed through raw by 8
    expect(render('note <!-- a -- b --> end')).toBe(
      '<p>note <!-- a -- b --> end</p>\n'
    )
  })

  it('accepts a link destination in angle brackets with a space', () => {
    expect(render('[x](</a b>)')).toBe('<p><a href="/a%20b">x</a></p>\n')
  })

  it('leaves an out-of-range numeric entity as text (8 emitted U+FFFD)', () => {
    expect(render('x &#98765432; y')).toBe('<p>x &amp;#98765432; y</p>\n')
  })
})
