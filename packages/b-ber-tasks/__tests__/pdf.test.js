import { exec } from 'node:child_process'
import path from 'node:path'
import log from '@canopycanopycanopy/b-ber-logger'
import exists from 'command-exists'
import fs from 'fs-extra'
import pdf from '../src/pdf'
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
const ops = (...args) => path.join(project.dist, 'OPS', ...args)

// A pdf build as far as this task, with `pdf_options` from config.yml
const setup = async (pdfOptions) => {
  project = await createProject({
    build: 'pdf',
    metadata: METADATA,
    config: pdfOptions ? { pdf_options: pdfOptions } : {},
  })
  await fs.outputFile(ops('content.opf'), '')
  await fs.outputFile(ops('toc.xhtml'), '')
}

// The flags after the input and output paths
const flags = () => command().split('.pdf" ')[1]

describe('task: pdf', () => {
  test('converts content.opf to <identifier>.pdf in the working directory', async () => {
    await setup()

    await pdf(project.ctx)

    const book = path.resolve(process.cwd(), 'book-id.pdf')
    expect(command()).toBe(`ebook-convert "${ops('content.opf')}" "${book}" `)
  })

  // ebook-convert has no option to leave the TOC page out
  test('removes toc.xhtml from the build first', async () => {
    await setup()

    await pdf(project.ctx)

    expect(fs.existsSync(ops('toc.xhtml'))).toBe(false)
    expect(fs.existsSync(ops('content.opf'))).toBe(true)
  })

  test('passes pdf_options as ebook-convert flags', async () => {
    await setup({
      pdf_page_numbers: true,
      paper_size: 'a5',
      pdf_page_margin_top: 36,
      not_an_option: 'x',
    })

    await pdf(project.ctx)

    // Switches by name, settings with their value, unknown keys dropped
    expect(flags()).toBe(
      "--pdf-page-numbers --paper-size='a5' --pdf-page-margin-top='36'"
    )
  })

  test('converts nothing with --no-compile, but still removes toc.xhtml', async () => {
    await setup()
    process.argv = [...argv, '--no-compile']

    await expect(pdf(project.ctx)).resolves.toBeUndefined()
    expect(exec).not.toHaveBeenCalled()
    expect(fs.existsSync(ops('toc.xhtml'))).toBe(false)
  })

  test('rejects, through log.error, when the conversion fails', async () => {
    await setup()
    const err = new Error('Command failed')
    exec.mockImplementation((_cmd, _opts, cb) => cb(err, '', ''))

    await expect(pdf(project.ctx)).rejects.toBe(err)
    expect(log.error).toHaveBeenCalledWith(err)
  })

  // #801: a switch was passed whatever its value, so `false` turned it on
  test('leaves a switch off when pdf_options sets it false (#801)', async () => {
    await setup({ pdf_page_numbers: false, pdf_add_toc: true })

    await pdf(project.ctx)

    expect(flags()).toBe('--pdf-add-toc')
  })

  // #801: `embed_all_fonts` and `insert_metadata` were listed with a
  // trailing space, so they never matched and were dropped
  test('passes embed_all_fonts and insert_metadata (#801)', async () => {
    await setup({ embed_all_fonts: true, insert_metadata: true })

    await pdf(project.ctx)

    expect(flags()).toBe('--embed-all-fonts --insert-metadata')
  })

  // #801: setting values were not quoted for the shell, so one with a space
  // (a TOC title, a header template) split into several arguments
  test('quotes option values for the shell (#801)', async () => {
    await setup({ toc_title: "The Book's Contents", margin_top: 72 })

    await pdf(project.ctx)

    expect(flags()).toBe(
      "--toc-title='The Book'\\''s Contents' --margin-top='72'"
    )
  })
})
