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
