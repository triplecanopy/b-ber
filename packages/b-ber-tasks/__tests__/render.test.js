import path from 'node:path'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import render from '../src/render'
import { returnReportedErrors } from './helpers/log'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

beforeEach(() => returnReportedErrors(log))

// `render` does not wait for its own writes (see the defect test below), so
// the tests collect the promises fs.writeFile returns and await them. The
// spy calls through: the files are really written.
let writes
let project

beforeEach(() => {
  writes = []
  const writeFile = fs.writeFile
  jest.spyOn(fs, 'writeFile').mockImplementation((...args) => {
    const p = writeFile(...args)
    writes.push(p)
    return p
  })
})

afterEach(async () => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
  if (project) await project.cleanup()
  project = undefined
})

const settle = async () => {
  await Promise.all(writes)
}

describe('task: render', () => {
  test('writes one XHTML file per Markdown file', async () => {
    project = await createProject({
      toc: ['one', 'two'],
      markdown: { one: '# One', two: 'Some *text*' },
    })

    await render()
    await settle()

    const text = path.join(project.dist, 'OPS', 'text')
    expect((await fs.readdir(text)).sort()).toEqual(['one.xhtml', 'two.xhtml'])
  })

  // The body template is bare; the inject task adds the document head and
  // tail later in the build
  test('renders the Markdown into the XHTML body template', async () => {
    project = await createProject({
      toc: ['one'],
      markdown: { one: '# Heading\n\nSome *emphasis*' },
    })

    await render()
    await settle()

    const xhtml = await fs.readFile(
      path.join(project.dist, 'OPS', 'text', 'one.xhtml'),
      'utf8'
    )
    expect(xhtml).toBe('<h1>Heading</h1>\n<p>Some <em>emphasis</em></p>\n')
  })

  test('skips dotfiles in the Markdown directory', async () => {
    project = await createProject({ toc: ['one'], markdown: { one: 'x' } })
    await fs.writeFile(
      path.join(project.src, '_markdown', '.DS_Store'),
      'not markdown'
    )

    await render()
    await settle()

    const text = path.join(project.dist, 'OPS', 'text')
    expect(await fs.readdir(text)).toEqual(['one.xhtml'])
  })

  test('renders files in spine order, not directory order', async () => {
    // Directory order is alphabetical (a, b, c); the TOC reverses it
    project = await createProject({
      toc: ['c', 'b', 'a'],
      markdown: { a: 'a', b: 'b', c: 'c' },
    })

    await render()
    await settle()

    const rendered = log.info.mock.calls
      .map(([msg]) => msg)
      .filter((msg) => msg.startsWith('render markdown'))
    expect(rendered).toEqual([
      'render markdown [c.md]',
      'render markdown [b.md]',
      'render markdown [a.md]',
    ])
  })

  // The renderer returns what each document collects, and the task writes it
  // where the later tasks read it (TASK-177). The grammars wrote it to State
  // themselves before
  test('writes what each document collects to State', async () => {
    project = await createProject({
      toc: ['one'],
      markdown: {
        one: '---\ntitle: One\ntype: bodymatter\n---\n\nText^[A note].\n',
      },
    })

    await render()
    await settle()

    const state = require('@canopycanopycanopy/b-ber-lib').State
    // The notes page is headed with the document's title in the spine
    expect(state.footnotes).toEqual([
      expect.objectContaining({ fileName: 'one', title: 'One' }),
    ])
    expect(state.footnotes[0].notes).toContain('A note')
    expect(state.guide).toEqual([
      expect.objectContaining({
        fileName: 'one',
        title: 'One',
        type: 'bodymatter',
      }),
    ])
    expect(state.spine.frontMatter.get('one')).toEqual({
      title: 'One',
      type: 'bodymatter',
    })
  })

  // Five published books number their notes across the book. The numbering
  // is made once per render task and passed to every document
  test('numbers footnotes across the book under group_footnotes: false', async () => {
    project = await createProject({
      toc: ['one', 'two'],
      config: { group_footnotes: false },
      markdown: { one: 'A^[a] b^[b].\n', two: 'C^[c] d^[d].\n' },
    })

    await render()
    await settle()

    const state = require('@canopycanopycanopy/b-ber-lib').State
    const [one, two] = state.footnotes.map((f) => f.notes)
    expect(one).toContain('<ol class="footnotes" start="1">')
    expect(two).toContain('<ol class="footnotes" start="3">')
    const xhtml = await fs.readFile(
      path.join(project.dist, 'OPS', 'text', 'two.xhtml'),
      'utf8'
    )
    expect(xhtml).toMatch(/>3<\/a>.*>4<\/a>/)
  })

  test('numbers each document’s footnotes from 1 by default', async () => {
    project = await createProject({
      toc: ['one', 'two'],
      markdown: { one: 'A^[a] b^[b].\n', two: 'C^[c] d^[d].\n' },
    })

    await render()
    await settle()

    const state = require('@canopycanopycanopy/b-ber-lib').State
    expect(state.footnotes[1].notes).toContain('start="1"')
  })

  test('resolves with nothing when the Markdown directory is empty', async () => {
    project = await createProject()

    await expect(render()).resolves.toBeUndefined()
    expect(fs.existsSync(path.join(project.dist, 'OPS', 'text'))).toBe(false)
  })

  test('rejects when the Markdown directory does not exist', async () => {
    project = await createProject()
    await fs.remove(path.join(project.src, '_markdown'))

    // The readdir failure is not caught: only the per-file chain is
    await expect(render()).rejects.toMatchObject({ code: 'ENOENT' })
  })

  test('passes a per-file failure to log.error and stops there', async () => {
    project = await createProject({ toc: ['one'], markdown: { one: 'x' } })
    // A directory with a .md name: readFile fails with EISDIR. It is not in
    // the TOC, so it sorts first and the files after it are never rendered
    await fs.ensureDir(path.join(project.src, '_markdown', 'broken.md'))

    await expect(render()).rejects.toMatchObject({ code: 'EISDIR' })
    await settle()

    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'EISDIR' })
    )
    expect(
      fs.existsSync(path.join(project.dist, 'OPS', 'text', 'one.xhtml'))
    ).toBe(false)
  })

  // DEFECT (#770): `writeMarkupToFile` (src/render/index.ts:9) neither returns nor
  // awaits its fs.writeFile, so `render()` resolves before the XHTML is on
  // disk and a write failure is unhandled. The next task in the sequence can
  // read a file that is not there yet.
  test('resolves before its XHTML writes complete (defect)', async () => {
    project = await createProject({ toc: ['one'], markdown: { one: 'x' } })

    let writeSettled = false
    const writeFile = fs.writeFile.getMockImplementation()
    fs.writeFile.mockImplementation((...args) => {
      const p = writeFile(...args).then(() => {
        writeSettled = true
      })
      writes.push(p)
      return p
    })

    await render()
    expect(writeSettled).toBe(false)

    await settle()
    expect(writeSettled).toBe(true)
  })
})
