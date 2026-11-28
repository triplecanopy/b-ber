import path from 'node:path'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import footnotes from '../src/footnotes'
import opf from '../src/opf'
import render from '../src/render'
import { trackWrites } from './helpers/files'
import { returnReportedErrors } from './helpers/log'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

let project
let settle

beforeEach(() => {
  returnReportedErrors(log)
  settle = trackWrites()
})

afterEach(async () => {
  await settle()
  jest.restoreAllMocks()
  jest.clearAllMocks()
  if (project) await project.cleanup()
  project = undefined
})

const ops = (...args) => path.join(project.dist, 'OPS', ...args)

const withNote = (text, note) => `${text}[^1]\n\n[^1]: ${note}\n`

// Render the project, then run the footnotes task
const build = async (options) => {
  project = await createProject(options)
  const { spine } = project.ctx.settings
  const output = await render(project.ctx, { spine })
  await settle()
  return footnotes(project.ctx, { footnotes: output.footnotes, spine })
}

describe('task: footnotes', () => {
  test('writes no notes page when the source has no footnotes', async () => {
    await expect(
      build({ toc: ['one'], markdown: { one: 'No notes here' } })
    ).resolves.toBeUndefined()

    expect(await fs.readdir(ops('text'))).toEqual(['one.xhtml'])
  })

  test("collects every file's footnotes into notes.xhtml", async () => {
    await build({
      toc: ['one', 'two'],
      markdown: {
        one: withNote('First', 'The first note'),
        two: withNote('Second', 'The second note'),
      },
    })

    const notes = await fs.readFile(ops('text', 'notes.xhtml'), 'utf8')
    expect(notes).toContain('The first note')
    expect(notes).toContain('The second note')
    // In spine order, each file's under a heading of its own
    expect(notes.indexOf('The first note')).toBeLessThan(
      notes.indexOf('The second note')
    )
    expect(notes.match(/<section class="footnotes break-after">/g)).toEqual([
      expect.anything(),
      expect.anything(),
    ])
  })

  test("heads each file's notes with its title from the TOC", async () => {
    await build({
      toc: [{ one: { title: 'Chapter One' } }],
      markdown: { one: withNote('Text', 'A note') },
    })

    const notes = await fs.readFile(ops('text', 'notes.xhtml'), 'utf8')
    expect(notes).toMatch(/<h1>\s*Chapter One<\/h1>/)
  })

  test('returns the notes page, added to the end of the spine out of reading order', async () => {
    const page = await build({
      toc: ['one'],
      markdown: { one: withNote('Text', 'A note') },
    })

    expect(page).toMatchObject({
      fileName: 'notes',
      linear: false,
      in_toc: false,
      generated: true,
    })
    expect(project.ctx.settings.spine.flattened.at(-1)).toBe(page)
  })

  test('the notes link back to the reference in the text', async () => {
    await build({ toc: ['one'], markdown: { one: withNote('Text', 'A note') } })

    const notes = await fs.readFile(ops('text', 'notes.xhtml'), 'utf8')
    expect(notes).toContain('one.xhtml#')
  })

  test('the OPF lists the notes page in the spine, out of reading order', async () => {
    await build({
      toc: ['one'],
      markdown: { one: withNote('Text', 'A note') },
      metadata: [{ term: 'identifier', value: 'book-id' }],
    })
    await fs.ensureDir(ops('stylesheets'))
    await fs.ensureDir(ops('javascripts'))

    await opf()

    const contents = await fs.readFile(ops('content.opf'), 'utf8')
    expect(contents).toContain('href="text/notes.xhtml"')
    expect(contents).toContain('<itemref idref="_notes_xhtml" linear="no"/>')
  })

  test('rejects, through log.error, when the notes cannot be written', async () => {
    project = await createProject({
      toc: ['one'],
      markdown: { one: withNote('Text', 'A note') },
    })
    const { spine } = project.ctx.settings
    const output = await render(project.ctx, { spine })
    await settle()
    await fs.remove(ops('text'))

    await expect(
      footnotes(project.ctx, { footnotes: output.footnotes, spine })
    ).rejects.toMatchObject({ code: 'ENOENT' })
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ENOENT' })
    )
  })
})
