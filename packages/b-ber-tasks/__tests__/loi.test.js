import path from 'node:path'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import loi from '../src/loi'
import render from '../src/render'
import { png, trackWrites } from './helpers/files'
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

const text = (...args) => path.join(project.dist, 'OPS', 'text', ...args)
const read = (name) => fs.readFile(text(name), 'utf8')

// Render a project whose chapter has a figure for each image, then run loi
const build = async ({
  build: buildType = 'epub',
  images = {},
  before = () => {},
} = {}) => {
  const markdown = Object.keys(images)
    .map((name, i) => `::: figure:fig-${i + 1} source:${name}\n`)
    .join('\n')

  project = await createProject({
    build: buildType,
    toc: ['chapter'],
    markdown: { chapter: `# Chapter\n\n${markdown}` },
  })
  await fs.ensureDir(path.join(project.src, '_images'))
  await Promise.all(
    Object.entries(images).map(([name, [w, h]]) =>
      fs.writeFile(path.join(project.src, '_images', name), png(w, h))
    )
  )

  await render()
  await settle()
  await before()
  return loi()
}

describe('task: loi', () => {
  test('writes nothing when the project has no figures', async () => {
    await build()

    expect(await fs.readdir(text())).toEqual(['chapter.xhtml'])
  })

  describe('epub (and every build but reader)', () => {
    test('writes a figures title page and one page per figure', async () => {
      await build({ images: { 'a.png': [400, 300], 'b.png': [300, 400] } })

      expect((await fs.readdir(text())).sort()).toEqual([
        'chapter.xhtml',
        'figurefig-1.xhtml',
        'figurefig-2.xhtml',
        'figures-titlepage.xhtml',
      ])
    })

    test('the title page is the Figures heading alone', async () => {
      await build({ images: { 'a.png': [400, 300] } })

      const page = await read('figures-titlepage.xhtml')
      expect(page).toContain('Figures')
      expect(page).not.toContain('a.png')
    })

    test("each figure's page shows its image, linked back to the text", async () => {
      await build({ images: { 'a.png': [400, 300] } })

      const page = await read('figurefig-1.xhtml')
      expect(page).toContain('../images/a.png')
      expect(page).toContain('chapter.xhtml#ref')
    })

    test('the chapter links each figure to its own page', async () => {
      await build({ images: { 'a.png': [400, 300] } })

      expect(await read('chapter.xhtml')).toContain('href="figurefig-1.xhtml#')
    })
  })

  describe('reader', () => {
    test('writes every figure into a single title page', async () => {
      await build({
        build: 'reader',
        images: { 'a.png': [400, 300], 'b.png': [300, 400] },
      })

      expect((await fs.readdir(text())).sort()).toEqual([
        'chapter.xhtml',
        'figures-titlepage.xhtml',
      ])
      const page = await read('figures-titlepage.xhtml')
      expect(page).toContain('Figures')
      expect(page).toContain('a.png')
      expect(page).toContain('b.png')
    })

    test('the chapter links each figure to the title page', async () => {
      await build({ build: 'reader', images: { 'a.png': [400, 300] } })

      expect(await read('chapter.xhtml')).toContain(
        'href="figures-titlepage.xhtml#'
      )
    })
  })

  test('rejects, through log.error, when the text directory is gone', async () => {
    await expect(
      build({
        images: { 'a.png': [400, 300] },
        // Between render and loi
        before: () => fs.remove(text()),
      })
    ).rejects.toMatchObject({ code: 'ENOENT' })
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ENOENT' })
    )
  })
})
