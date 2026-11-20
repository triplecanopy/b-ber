import { exec } from 'node:child_process'
import path from 'node:path'
import log from '@canopycanopycanopy/b-ber-logger'
import exists from 'command-exists'
import fs from 'fs-extra'
import mobi from '../src/mobi'
import mobiCSS from '../src/mobi/mobi-css'
import { returnReportedErrors } from './helpers/log'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

// The process boundary: calibre's ebook-convert, and the check that it is
// installed. Everything up to the command line is real.
jest.mock('node:child_process', () => ({ exec: jest.fn() }))
jest.mock('command-exists', () => jest.fn())

let project
const { argv } = process

beforeEach(() => {
  returnReportedErrors(log)
  exists.mockImplementation((_cmd, cb) => cb(null, true))
  exec.mockImplementation((_cmd, _opts, cb) => cb(null, '', ''))
})

afterEach(async () => {
  process.argv = argv
  jest.resetAllMocks()
  if (project) await project.cleanup()
  project = undefined
})

const METADATA = [{ term: 'identifier', value: 'book-id' }]
const command = () => exec.mock.calls[0][0]

describe('task: mobi', () => {
  test('converts content.opf to <identifier>.mobi in the working directory', async () => {
    project = await createProject({ build: 'mobi', metadata: METADATA })

    await mobi()

    expect(exec).toHaveBeenCalledTimes(1)
    const opf = path.join(project.dist, 'OPS', 'content.opf')
    const book = path.resolve(process.cwd(), 'book-id.mobi')
    expect(command()).toStartWith(`ebook-convert ${opf} "${book}" `)
    expect(exec.mock.calls[0][1]).toEqual({ cwd: process.cwd() })
  })

  test('asks for KF8 and the old format, without calibre’s own changes', async () => {
    project = await createProject({ build: 'mobi', metadata: METADATA })

    await mobi()

    for (const flag of [
      '--mobi-file-type=both',
      '--disable-font-rescaling',
      '--no-inline-toc',
      '--chapter="/"',
      '--chapter-mark=none',
      '--disable-remove-fake-margins',
    ]) {
      expect(command()).toContain(` ${flag}`)
    }
    // A page break before large inline figures, the paragraph after one,
    // `.break-before` and each gallery item
    expect(command()).toContain(
      `--page-breaks-before='//h:*[@class="figure__large figure__inline"]|//h:*[@class="figure__large figure__inline"]/following::h:p[1]|//h:*[contains(@class, "break-before")]|//h:*[@data-gallery-item]'`
    )
  })

  test('converts nothing with --no-compile', async () => {
    project = await createProject({ build: 'mobi', metadata: METADATA })
    process.argv = [...argv, '--no-compile']

    await expect(mobi()).resolves.toBeUndefined()
    expect(exists).not.toHaveBeenCalled()
    expect(exec).not.toHaveBeenCalled()
  })

  test('rejects, through log.error, when calibre is not installed', async () => {
    project = await createProject({ build: 'mobi', metadata: METADATA })
    exists.mockImplementation((_cmd, cb) => cb(null, false))

    await expect(mobi()).rejects.toThrow(
      "calibre's ebook-convert must be installed"
    )
    expect(exec).not.toHaveBeenCalled()
    expect(log.error).toHaveBeenCalled()
  })

  test('rejects, through log.error, when the conversion fails', async () => {
    project = await createProject({ build: 'mobi', metadata: METADATA })
    const err = new Error('Command failed')
    exec.mockImplementation((_cmd, _opts, cb) => cb(err, '', 'Traceback'))

    await expect(mobi()).rejects.toBe(err)
    expect(log.error).toHaveBeenCalledWith(err)
  })

  // Defect, in b-ber-lib's EbookConvert (src/EbookConvert.ts:51): the output
  // path is quoted and the input path is not, so a project under a directory
  // whose name has a space hands ebook-convert a broken command line.
  test('does not quote the input path (defect)', async () => {
    project = await createProject({
      build: 'mobi',
      metadata: METADATA,
      dist: path.join('my book', 'project'),
    })

    await mobi()

    const opf = path.join(project.dist, 'OPS', 'content.opf')
    expect(opf).toContain('my book')
    expect(command()).toContain(`ebook-convert ${opf} `)
    expect(command()).not.toContain(`"${opf}"`)
  })
})

describe('task: mobiCSS', () => {
  const stylesheets = (...args) =>
    path.join(project.dist, 'OPS', 'stylesheets', ...args)

  const setup = async (files) => {
    project = await createProject({ build: 'mobi' })
    await Promise.all(
      Object.entries(files).map(([name, css]) =>
        fs.outputFile(stylesheets(name), css)
      )
    )
  }

  test('removes the declarations that break mobi files', async () => {
    await setup({
      'application.css':
        'p { color: red; line-height: 1.5; hyphens: auto; widows: 2; orphans: 2 }',
    })

    await mobiCSS()

    expect(await fs.readFile(stylesheets('application.css'), 'utf8')).toBe(
      'p {\n  color: red;\n}'
    )
  })

  test('removes @namespace rules and epub| selectors', async () => {
    await setup({
      'application.css':
        '@namespace epub "http://www.idpf.org/2007/ops";\nepub|type, h1 { color: red }',
    })

    await mobiCSS()

    expect(await fs.readFile(stylesheets('application.css'), 'utf8')).toBe(
      'h1 {\n  color: red;\n}'
    )
  })

  // Defect: a rule whose only selectors are `epub|` ones keeps its
  // declarations with no selector at all (src/mobi/mobi-css.ts:52), which is
  // not valid CSS.
  test('leaves a rule with no selector behind (defect)', async () => {
    await setup({ 'application.css': 'epub|switch { display: none }' })

    await mobiCSS()

    expect(await fs.readFile(stylesheets('application.css'), 'utf8')).toBe(
      ' {\n  display: none;\n}'
    )
  })

  test('rewrites every stylesheet in the build', async () => {
    await setup({
      'a.css': 'a { color: red; widows: 2 }',
      'b.css': 'b { color: blue; orphans: 2 }',
    })

    await mobiCSS()

    expect(await fs.readFile(stylesheets('a.css'), 'utf8')).toBe(
      'a {\n  color: red;\n}'
    )
    expect(await fs.readFile(stylesheets('b.css'), 'utf8')).toBe(
      'b {\n  color: blue;\n}'
    )
  })

  test('rejects, through log.error, when a stylesheet does not parse', async () => {
    await setup({ 'a.css': 'a { color: red' })

    await expect(mobiCSS()).rejects.toThrow('missing')
    expect(log.error).toHaveBeenCalled()
  })

  test('rejects when the build has no stylesheets directory', async () => {
    project = await createProject({ build: 'mobi' })

    await expect(mobiCSS()).rejects.toMatchObject({ code: 'ENOENT' })
  })
})
