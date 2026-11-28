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

    await render(project.ctx, { spine: project.ctx.settings.spine })
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

    await render(project.ctx, { spine: project.ctx.settings.spine })
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

    await render(project.ctx, { spine: project.ctx.settings.spine })
    await settle()

    const text = path.join(project.dist, 'OPS', 'text')
    expect(await fs.readdir(text)).toEqual(['one.xhtml'])
  })

  // The grammar plugins still collect these through State, which is this
  // build's context in a build; render returns them for the steps after it
  test('returns what the documents collected', async () => {
    project = await createProject({
      toc: ['one'],
      markdown: { one: 'Text.[^1]\n\n[^1]: A note.' },
    })

    const output = await render(project.ctx, {
      spine: project.ctx.settings.spine,
    })
    await settle()

    expect(output.footnotes).toEqual([
      expect.objectContaining({ fileName: 'one' }),
    ])
    expect(output.footnotes).toBe(project.ctx.settings.footnotes)
    expect(output.figures).toBe(project.ctx.settings.figures)
    expect(output.guide).toBe(project.ctx.settings.guide)
    expect(output.remoteAssets).toBe(project.ctx.settings.remoteAssets)
  })

  test('renders files in spine order, not directory order', async () => {
    // Directory order is alphabetical (a, b, c); the TOC reverses it
    project = await createProject({
      toc: ['c', 'b', 'a'],
      markdown: { a: 'a', b: 'b', c: 'c' },
    })

    await render(project.ctx, { spine: project.ctx.settings.spine })
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

  test('collects nothing when the Markdown directory is empty', async () => {
    project = await createProject()

    await expect(
      render(project.ctx, { spine: project.ctx.settings.spine })
    ).resolves.toEqual({
      figures: [],
      footnotes: [],
      guide: [],
      remoteAssets: [],
    })
    expect(fs.existsSync(path.join(project.dist, 'OPS', 'text'))).toBe(false)
  })

  test('rejects when the Markdown directory does not exist', async () => {
    project = await createProject()
    await fs.remove(path.join(project.src, '_markdown'))

    // The readdir failure is not caught: only the per-file chain is
    await expect(
      render(project.ctx, { spine: project.ctx.settings.spine })
    ).rejects.toMatchObject({ code: 'ENOENT' })
  })

  test('passes a per-file failure to log.error and stops there', async () => {
    project = await createProject({ toc: ['one'], markdown: { one: 'x' } })
    // A directory with a .md name: readFile fails with EISDIR. It is not in
    // the TOC, so it sorts first and the files after it are never rendered
    await fs.ensureDir(path.join(project.src, '_markdown', 'broken.md'))

    await expect(
      render(project.ctx, { spine: project.ctx.settings.spine })
    ).rejects.toMatchObject({ code: 'EISDIR' })
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

    await render(project.ctx, { spine: project.ctx.settings.spine })
    expect(writeSettled).toBe(false)

    await settle()
    expect(writeSettled).toBe(true)
  })
})
