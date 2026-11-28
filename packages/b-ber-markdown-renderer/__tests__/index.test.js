import path from 'node:path'
import fs from 'fs-extra'

// State singleton initialises in its constructor and checks for the media dir.
// Create the required directories before any module is imported.
let markdownRenderer

beforeAll(async () => {
  // State initialises in its constructor and tries to load _project/toc.yml
  // via Spine. Create the minimum project structure needed for State to start.
  await fs.mkdirp('_project/_media')
  await fs.writeFile('_project/toc.yml', '[]\n', 'utf8')
  // Defer import so State initialises after the directories exist
  // eslint-disable-next-line global-require
  markdownRenderer = require('../src').default
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

  it('exposes a prepare() method', () => {
    expect(typeof markdownRenderer.prepare).toBe('function')
  })

  it('exposes a template() method', () => {
    expect(typeof markdownRenderer.template).toBe('function')
  })

  it('has a markdownIt instance', () => {
    expect(markdownRenderer.markdownIt).toBeDefined()
    expect(typeof markdownRenderer.markdownIt.render).toBe('function')
  })

  it('template() formats YAML front matter with two-space indent', () => {
    const result = markdownRenderer.template('title: Hello\nauthor: World')
    expect(result).toContain('  title: Hello')
    expect(result).toContain('  author: World')
    expect(result.startsWith('-\n')).toBe(true)
  })

  it('template() includes the fileName in the output', () => {
    markdownRenderer.fileName = 'chapter-01'
    const result = markdownRenderer.template('title: Test')
    expect(result).toContain('fileName: chapter-01')
  })

  it('prepare() returns a string', () => {
    const result = markdownRenderer.prepare('# Hello\n\nParagraph text.\n')
    expect(typeof result).toBe('string')
  })

  it('render() converts a plain paragraph to HTML', () => {
    const result = markdownRenderer.render('test.md', 'Hello world.\n')
    expect(result).toContain('Hello world.')
    expect(result).toContain('<p>')
  })

  it('render() sets fileName on the instance', () => {
    markdownRenderer.render('my-chapter.md', 'Some text.\n')
    expect(markdownRenderer.fileName).toBe('my-chapter.md')
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
  let state

  beforeAll(() => {
    // A real build fills this in from the project (State#loadBuilds). The
    // fixture needs only what front matter, sections and footnotes write to.
    state = require('@canopycanopycanopy/b-ber-lib').State
    state.update('builds.epub', {
      guide: [],
      spine: { frontMatter: new Map(), flattened: [] },
      cursor: [],
      figures: [],
      footnotes: [],
    })
  })

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
    markdownRenderer.render('rendering-fixture', source)
    const entry = state.footnotes.findLast(
      (f) => f.fileName === 'rendering-fixture'
    )
    expect(stableIds(entry.notes)).toMatchSnapshot()
  })
})

// The structural blocks go through the directive rule (TASK-174), which keeps
// today's ids in `state.cursor` and today's errors for the old plugins
describe('b-ber-markdown-renderer: structural blocks', () => {
  let state

  beforeEach(() => {
    state = require('@canopycanopycanopy/b-ber-lib').State
    state.cursor = []
  })

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
