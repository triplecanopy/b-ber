import path from 'node:path'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import generate from '../src/generate'
import { returnReportedErrors } from './helpers/log'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

let project

beforeEach(() => returnReportedErrors(log))

afterEach(async () => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
  if (project) await project.cleanup()
  project = undefined
})

const markdown = (name) =>
  fs.readFile(path.join(project.src, '_markdown', name), 'utf8')
const yml = (name) => YamlAdaptor.load(path.join(project.src, name))

describe('task: generate', () => {
  test('writes a Markdown file with the front matter given', async () => {
    project = await createProject()

    await generate({ title: 'Chapter One', type: 'bodymatter', section: '' })

    // Named after the title; empty values are left out
    expect(await markdown('Chapter-One.md')).toBe(
      '---\ntitle: Chapter One\ntype: bodymatter\n---\n'
    )
  })

  test('creates _markdown when it does not exist', async () => {
    project = await createProject()
    await fs.remove(path.join(project.src, '_markdown'))

    await generate({ title: 'one' })

    expect(await markdown('one.md')).toBe('---\ntitle: one\n---\n')
  })

  test('appends the page to toc.yml', async () => {
    project = await createProject({ toc: ['intro'] })

    await generate({ title: 'Chapter One' })

    expect(yml('toc.yml')).toEqual(['intro', 'Chapter-One'])
  })

  test("appends it to each build's own TOC too, where one exists", async () => {
    project = await createProject({ toc: ['intro'] })
    await fs.writeFile(path.join(project.src, 'web.yml'), '- intro')
    // The task does not wait for these appends: see the defect test below
    const appends = []
    const appendFile = fs.appendFile
    jest.spyOn(fs, 'appendFile').mockImplementation((...args) => {
      const p = appendFile(...args)
      appends.push(p)
      return p
    })

    await generate({ title: 'one' })
    await Promise.all(appends)

    expect(yml('web.yml')).toEqual(['intro', 'one'])
    expect(fs.existsSync(path.join(project.src, 'epub.yml'))).toBe(false)
  })

  // Defect: the appends to the builds' own TOC files are collected with
  // `reduce` and `concat`, which returns a new array, and the original array,
  // holding only the toc.yml append, is what is awaited
  // (src/generate/index.ts:61). The task resolves before web.yml and the
  // like are written, and a failure writing them is unhandled. The same
  // family as #770.
  test("resolves before the builds' own TOCs are written (defect)", async () => {
    project = await createProject({ toc: ['intro'] })
    const webYml = path.join(project.src, 'web.yml')
    await fs.writeFile(webYml, '- intro')
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    const appendFile = fs.appendFile
    let webWritten
    jest.spyOn(fs, 'appendFile').mockImplementation((file, ...rest) => {
      if (file !== webYml) return appendFile(file, ...rest)
      webWritten = gate.then(() => appendFile(file, ...rest))
      return webWritten
    })

    await generate({ title: 'one' })

    expect(yml('web.yml')).toEqual(['intro'])
    release()
    await webWritten
    expect(yml('web.yml')).toEqual(['intro', 'one'])
  })

  test('rejects, through log.error, when the file already exists', async () => {
    project = await createProject({ toc: ['one'], markdown: { one: 'Text' } })

    await expect(generate({ title: 'one' })).rejects.toThrow(
      `_markdown${path.sep}one.md already exists, aborting`
    )
    expect(await markdown('one.md')).toBe('Text')
    expect(yml('toc.yml')).toEqual(['one'])
  })

  // Defect: the check for a page already in toc.yml compares the TOC's
  // entries with the file name *with* its `.md` extension
  // (src/generate/index.ts:47), and TOC entries have none, so it never
  // matches. A page listed in the TOC whose Markdown file is missing is
  // listed a second time.
  test('lists a page twice when the TOC already has it (defect)', async () => {
    project = await createProject({ toc: ['one'] })

    await generate({ title: 'one' })

    expect(yml('toc.yml')).toEqual(['one', 'one'])
  })
})
