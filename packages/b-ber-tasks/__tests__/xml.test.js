import path from 'node:path'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import loi from '../src/loi'
import render from '../src/render'
import xml from '../src/xml'
import { png, trackWrites } from './helpers/files'
import { returnReportedErrors } from './helpers/log'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

// The xml task finds each page through its spine entry's `absolutePath`,
// which is resolved against the working directory, and writes into the
// working directory. So these tests run from inside the project, as the CLI
// does.
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

const METADATA = [{ term: 'identifier', value: 'book-id' }]

// Render the project's Markdown, then run the xml task
const build = async ({ images = {}, ...options }) => {
  project = await createProject({
    build: 'xml',
    chdir: true,
    metadata: METADATA,
    ...options,
  })
  await fs.ensureDir(path.join(project.src, '_images'))
  await Promise.all(
    Object.entries(images).map(([name, [w, h]]) =>
      fs.writeFile(path.join(project.src, '_images', name), png(w, h))
    )
  )
  const { figures } = await render(project.ctx, {
    spine: project.ctx.settings.spine,
  })
  await settle()
  return figures
}

// The figure pages, recorded where xml reads them, as the target's build does
const runLoi = async (figures) => {
  const { pages } = await loi(project.ctx, {
    figures,
    spine: project.ctx.settings.spine,
  })
  project.ctx.settings.loi = pages
}

const readXml = () =>
  fs.readFile(path.join(project.root, 'book-id.xml'), 'utf8')

describe('task: xml', () => {
  test('writes <identifier>.xml to the working directory', async () => {
    await build({ toc: ['one'], markdown: { one: '# One' } })

    await xml()

    expect(await readXml()).toBe(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><body><h1>One</h1>\n</body>\n'
    )
  })

  test('joins the pages in spine order, with a page break between', async () => {
    await build({
      toc: ['b', 'a'],
      markdown: { a: 'Page A', b: 'Page B' },
    })

    await xml()

    const out = await readXml()
    expect(out).toContain('<p>Page B</p>\n<pagebreak></pagebreak>')
    expect(out.indexOf('Page B')).toBeLessThan(out.indexOf('Page A'))
  })

  test('places the figure pages after the figures title page', async () => {
    const figures = await build({
      toc: ['one', 'figures-titlepage', 'two'],
      markdown: {
        one: '::: figure:fig-1 source:a.png\n',
        two: 'The end',
      },
      images: { 'a.png': [400, 300] },
    })
    await runLoi(figures)

    await xml()

    // The chapter, the title page, the figure's own page, the next chapter
    const out = await readXml()
    const order = [
      'href="figurefig-1.xhtml#fig-1"',
      '<h1>Figures</h1>',
      'href="one.xhtml#reffig-1"',
      'The end',
    ].map((s) => out.indexOf(s))
    expect(order).not.toContain(-1)
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  test('rejects, through log.error, when a page is missing', async () => {
    await build({ toc: ['one', 'two'], markdown: { one: 'One' } })

    await expect(xml()).rejects.toMatchObject({ code: 'ENOENT' })
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ENOENT' })
    )
  })

  // When the TOC does not list `figures-titlepage`, the loi task adds one. It
  // used to add a plain object to `spine.flattened`, with no `absolutePath`,
  // and the xml task read `undefined.xhtml` for it (#757)
  test("includes a figures title page the TOC doesn't list (#757)", async () => {
    const figures = await build({
      toc: ['one'],
      markdown: { one: '::: figure:fig-1 source:a.png\n' },
      images: { 'a.png': [400, 300] },
    })
    await runLoi(figures)

    await xml()

    expect(await readXml()).toContain('<h1>Figures</h1>')
  })

  // SpineItem's `absolutePath` used to be `project-<build>/OPS/...` whatever
  // `dist` config.yml set (#766). With `dist: _builds`, as the kitchen-sink
  // fixture has, render wrote to `_builds-xml/` and xml read from
  // `project-xml/`, so `bber build xml` failed
  test('reads the pages from the build directory `dist` names (#766)', async () => {
    await build({ dist: '_builds', toc: ['one'], markdown: { one: 'One' } })
    expect(fs.existsSync(path.join('_builds-xml', 'OPS', 'text'))).toBe(true)

    await xml()

    expect(await readXml()).toContain('<p>One</p>')
  })
})
