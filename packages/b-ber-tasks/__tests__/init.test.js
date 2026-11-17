import os from 'node:os'
import path from 'node:path'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import Initializer from '../src/init'
import { returnReportedErrors } from './helpers/log'

jest.mock('@canopycanopycanopy/b-ber-logger')

// `bber new <name>` runs from the directory the project is created in, and
// leaves the process inside the new project. Each test starts in an empty
// temp directory and goes back afterwards.
const cwd = process.cwd()
let root

beforeEach(async () => {
  returnReportedErrors(log)
  root = await fs.realpath(
    await fs.mkdtemp(path.join(os.tmpdir(), 'b-ber-init-'))
  )
  process.chdir(root)
})

afterEach(async () => {
  jest.clearAllMocks()
  process.chdir(cwd)
  await fs.remove(root)
})

const project = (...args) => path.join(root, 'book', ...args)
const list = async (...args) => (await fs.readdir(project(...args))).sort()

describe('task: init', () => {
  test('creates the project directory with its sources and config', async () => {
    await new Initializer({ name: 'book' }).start()

    expect(await list()).toEqual([
      '.gitignore',
      'README.md',
      '_project',
      'config.yml',
      'themes',
    ])
    expect(await list('_project')).toEqual([
      '.tmp',
      '_fonts',
      '_images',
      '_javascripts',
      '_markdown',
      '_media',
      '_stylesheets',
      'metadata.yml',
      'toc.yml',
    ])
  })

  test('writes starter Markdown, listed in the TOC', async () => {
    await new Initializer({ name: 'book' }).start()

    const toc = YamlAdaptor.load(project('_project', 'toc.yml'))
    const pages = (await list('_project', '_markdown')).map((f) =>
      path.basename(f, '.md')
    )
    const names = (entries) =>
      entries.flatMap((e) => (typeof e === 'string' ? [e] : Object.keys(e)))
    expect(pages.length).toBeGreaterThan(0)
    // With the generated cover and TOC pages
    expect(names(toc).sort()).toEqual([...pages, 'cover', 'toc'].sort())
  })

  test('copies the development images into _images', async () => {
    await new Initializer({ name: 'book' }).start()

    const images = await list('_project', '_images')
    expect(images.length).toBeGreaterThanOrEqual(2)
  })

  test('sets up the default theme', async () => {
    await new Initializer({ name: 'book' }).start()

    const config = YamlAdaptor.load(project('config.yml'))
    expect(config.theme).toBe('b-ber-theme-serif')
    expect(await list('_project', '_stylesheets', 'b-ber-theme-serif')).toEqual(
      ['_overrides.scss', '_settings.scss']
    )
  })

  test('writes the config overrides given into config.yml', async () => {
    await new Initializer({
      name: 'book',
      config: { base_url: 'https://example.com/' },
    }).start()

    const config = YamlAdaptor.load(project('config.yml'))
    expect(config.base_url).toBe('https://example.com/')
  })

  test('leaves the process in the new project', async () => {
    await new Initializer({ name: 'book' }).start()

    expect(process.cwd()).toBe(project())
  })

  test('throws, through log.error, when the project already exists', async () => {
    await fs.ensureDir(project('_project'))

    expect(() => new Initializer({ name: 'book' })).toThrow(
      'Project [book] already exits, aborting'
    )
  })

  test('rejects, through log.error, when the directory is not writable', async () => {
    await fs.chmod(root, 0o555)

    try {
      await expect(
        new Initializer({ name: 'book' }).start()
      ).rejects.toMatchObject({ code: 'EACCES' })
      expect(log.error).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'EACCES' })
      )
    } finally {
      await fs.chmod(root, 0o755)
    }
  })
})
