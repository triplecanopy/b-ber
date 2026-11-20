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
  await render()
  await settle()
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
    await build({
      toc: ['one', 'figures-titlepage', 'two'],
      markdown: {
        one: '::: figure:fig-1 source:a.png\n',
        two: 'The end',
      },
      images: { 'a.png': [400, 300] },
    })
    await loi()

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

  // Defect: when the TOC does not list `figures-titlepage`, the loi task adds
  // one to `spine.flattened` as a plain object, not a SpineItem
  // (src/loi/index.ts:52), so it has no `absolutePath`. The xml task reads
  // `undefined.xhtml` for it, and an xml build of any project with figures
  // fails unless its TOC names the title page. Related to #757.
  test('fails for figures when the TOC has no figures title page (defect)', async () => {
    await build({
      toc: ['one'],
      markdown: { one: '::: figure:fig-1 source:a.png\n' },
      images: { 'a.png': [400, 300] },
    })
    await loi()

    await expect(xml()).rejects.toMatchObject({
      code: 'ENOENT',
      path: 'undefined.xhtml',
    })
  })

  // Defect: SpineItem's `absolutePath` is `project-<build>/OPS/...`, resolved
  // against the working directory (b-ber-lib/src/SpineItem.ts:68), whatever
  // `dist` config.yml sets. With `dist: _builds`, as the kitchen-sink fixture
  // has, render writes to `_builds-xml/` and xml reads from `project-xml/`.
  test('reads the pages from project-<build>, ignoring `dist` (defect)', async () => {
    await build({ dist: '_builds', toc: ['one'], markdown: { one: 'One' } })
    expect(fs.existsSync(path.join('_builds-xml', 'OPS', 'text'))).toBe(true)

    await expect(xml()).rejects.toMatchObject({
      code: 'ENOENT',
      path: path.join(project.root, 'project-xml', 'OPS', 'text', 'one.xhtml'),
    })
  })
})
