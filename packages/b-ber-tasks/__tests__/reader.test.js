import path from 'node:path'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import reader from '../src/reader'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

// The task copies the built reader app out of
// @canopycanopycanopy/b-ber-reader's dist/, so these tests need the
// workspace built first, like the other tests that read a sibling's dist.
const READER_DIST = path.join(
  path.dirname(require.resolve('@canopycanopycanopy/b-ber-reader')),
  'dist'
)

const METADATA = [
  { term: 'title', value: 'A Book' },
  { term: 'identifier', value: 'book-id' },
  { term: 'cover', value: 'cover.jpg' },
]

let project
let writes
const { NODE_ENV } = process.env

// What the epub-style build steps leave in the build directory by the time
// the reader task runs
const writeEpubBuild = async () => {
  const dist = project.dist
  await Promise.all([
    fs.outputFile(path.join(dist, 'mimetype'), 'application/epub+zip'),
    fs.outputFile(path.join(dist, 'META-INF', 'container.xml'), '<container/>'),
    fs.outputFile(path.join(dist, 'OPS', 'content.opf'), '<package/>'),
    fs.outputFile(path.join(dist, 'OPS', 'text', 'one.xhtml'), '<html/>'),
  ])
}

const setup = async (options = {}) => {
  project = await createProject({
    build: 'reader',
    toc: ['one'],
    metadata: METADATA,
    chdir: true,
    ...options,
  })
  await writeEpubBuild()
}

// `writeWebpubManifest` does not wait for its write (see the defect test),
// so the writes are collected and awaited. The spy calls through.
beforeEach(() => {
  // State logs while it initialises at import, before any test
  jest.clearAllMocks()
  writes = []
  const writeJson = fs.writeJson
  jest.spyOn(fs, 'writeJson').mockImplementation((...args) => {
    const p = writeJson(...args)
    writes.push(p)
    return p
  })
})

afterEach(async () => {
  process.env.NODE_ENV = NODE_ENV
  jest.restoreAllMocks()
  jest.clearAllMocks()
  if (project) await project.cleanup()
  project = undefined
})

const run = async () => {
  await reader()
  await Promise.all(writes)
}

const readIndex = () =>
  fs.readFile(path.join(project.dist, 'index.html'), 'utf8')

describe('task: reader', () => {
  test('moves the EPUB into epub/<identifier>/', async () => {
    await setup()
    await run()

    const book = path.join(project.dist, 'epub', 'book-id')
    expect(fs.existsSync(path.join(book, 'mimetype'))).toBe(true)
    expect(fs.existsSync(path.join(book, 'META-INF', 'container.xml'))).toBe(
      true
    )
    expect(fs.existsSync(path.join(book, 'OPS', 'text', 'one.xhtml'))).toBe(
      true
    )
    expect(fs.existsSync(path.join(project.dist, 'OPS'))).toBe(false)
    expect(log.error).not.toHaveBeenCalled()
  })

  test('copies the reader app into the build directory', async () => {
    await setup()
    await run()

    for (const file of await fs.readdir(READER_DIST)) {
      expect(fs.existsSync(path.join(project.dist, file))).toBe(true)
    }
  })

  test('writes api/books.json from the metadata and config', async () => {
    await setup()
    await run()

    const books = await fs.readJson(
      path.join(project.dist, 'api', 'books.json')
    )
    const url = 'http://localhost:4000/epub/book-id'
    expect(books).toEqual([
      {
        title: 'A Book',
        url,
        cover: `${url}/OPS/images/cover.jpg`,
        id: 'book-id',
        downloads: [],
        ui_options: state.config.ui_options,
        layout: 'columns',
      },
    ])
  })

  test('writes a webpub manifest of the EPUB contents', async () => {
    await setup()
    await run()

    const manifest = await fs.readJson(path.join(project.dist, 'manifest.json'))
    expect(manifest.metadata).toMatchObject({
      title: 'A Book',
      identifier: 'book-id',
    })
    expect(manifest.readingOrder).toHaveLength(1)
    expect(manifest.readingOrder[0].href).toEndWith('text/one.xhtml')
    expect(manifest.resources.map((r) => path.basename(r.href)).sort()).toEqual(
      ['content.opf', 'one.xhtml']
    )
  })

  test('injects the server data into index.html', async () => {
    await setup()
    await run()

    const html = await readIndex()
    const [, json] = html.match(/__SERVER_DATA__ = (\{.*\})/)
    const readerURL = 'http://localhost:4000/project-reader/'
    expect(JSON.parse(json)).toEqual({
      books: [
        {
          title: 'A Book',
          url: `${readerURL}epub/book-id`,
          cover: 'cover.jpg',
        },
      ],
      bookURL: `${readerURL}epub/book-id`,
      projectURL: 'http://localhost:4000/',
      downloads: [],
      basePath: '/',
      loadRemoteLibrary: false,
      uiOptions: state.config.ui_options,
      cache: true,
      layout: 'columns',
    })
  })

  test('makes root-relative asset URLs in index.html absolute', async () => {
    await setup()
    await run()

    const html = await readIndex()
    expect(html).not.toMatch(/(src|href)="\/[^"]/)
    expect(html).toMatch(
      /src="http:\/\/localhost:4000\/project-reader\/assets\/[^"]+\.js"/
    )
  })

  test('links the webpub manifest from index.html', async () => {
    await setup()
    await run()

    expect(await readIndex()).toContain(
      '<link rel="manifest" type="application/webpub+json" href="http://localhost:4000/project-reader/manifest.json"></head>'
    )
  })

  test('uses the configured reader_url and remote_url', async () => {
    await setup({
      config: {
        reader_url: 'https://reader.example.com',
        remote_url: 'https://books.example.com/',
      },
    })
    await run()

    const html = await readIndex()
    expect(html).toContain(
      '"bookURL":"https://reader.example.com/epub/book-id"'
    )
    expect(html).toContain('"projectURL":"https://books.example.com/"')
    const [book] = await fs.readJson(
      path.join(project.dist, 'api', 'books.json')
    )
    expect(book.url).toBe('https://books.example.com/epub/book-id')
  })

  test('warns about config terms that are not set', async () => {
    await setup()
    delete state.config.layout
    await run()

    expect(log.warn).toHaveBeenCalledWith('Invalid property for config: layout')
  })

  test('names the book directory with a random hash when there is no identifier', async () => {
    await setup({ metadata: [{ term: 'title', value: 'A Book' }] })
    await reader()

    expect(log.warn).toHaveBeenCalledWith(
      'Could not find metadata value for identifier'
    )
    const [dir] = await fs.readdir(path.join(project.dist, 'epub'))
    expect(dir).toMatch(/^[0-9a-f]{40}$/)
  })

  test('replaces characters other than letters, digits and dashes in the book directory name', async () => {
    await setup({
      metadata: [
        ...METADATA.slice(0, 1),
        { term: 'identifier', value: 'a.b c' },
      ],
    })
    await reader()

    expect(await fs.readdir(path.join(project.dist, 'epub'))).toEqual(['a-b-c'])
  })

  // DEFECT (#769): the book directory is named `createDirname(identifier)`
  // (src/reader/index.ts:131), but `writeWebpubManifest` (line 188) reads
  // `<outputDir>/<identifier>/OPS` with the raw identifier, and
  // `injectServerDataIntoTemplate` (line 232) builds `bookURL` from it too.
  // An identifier with any character outside [0-9a-zA-Z-], such as a
  // `urn:uuid:` one, makes the manifest scan fail with ENOENT, which ends the
  // task before the reader app is copied.
  test('fails for an identifier that createDirname changes (defect)', async () => {
    await setup({
      metadata: [
        ...METADATA.slice(0, 1),
        { term: 'identifier', value: 'urn:uuid:1234' },
      ],
    })
    await reader()

    expect(await fs.readdir(path.join(project.dist, 'epub'))).toEqual([
      'urn-uuid-1234',
    ])
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ENOENT' })
    )
    expect(fs.existsSync(path.join(project.dist, 'index.html'))).toBe(false)
  })

  // DEFECT (#770): `writeWebpubManifest` (src/reader/index.ts:193) does not return
  // its fs.writeJson, so the task can resolve before manifest.json is
  // written, and a failed write is an unhandled rejection
  test('does not wait for manifest.json to be written (defect)', async () => {
    await setup()
    // Hold the manifest write until the task has resolved. Were the task
    // waiting on it, it would never resolve and this test would time out
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    const writeJson = fs.writeJson.getMockImplementation()
    fs.writeJson.mockImplementation((file, ...rest) =>
      path.basename(file) === 'manifest.json'
        ? gate.then(() => writeJson(file, ...rest))
        : writeJson(file, ...rest)
    )
    const manifest = path.join(project.dist, 'manifest.json')

    await reader()
    expect(fs.existsSync(manifest)).toBe(false)
    expect(fs.existsSync(path.join(project.dist, 'index.html'))).toBe(true)

    release()
    await gate
    await Promise.all(writes)
    await fs.writeJson.mock.results.at(-1).value
    expect(fs.existsSync(manifest)).toBe(true)
  })

  test('requires an http remote_url in production', async () => {
    await setup({ config: { remote_url: '' } })
    process.env.NODE_ENV = 'production'

    await reader()

    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'Task [build/reader] requires a remote_url to be set in config.yml',
      })
    )
    expect(fs.existsSync(path.join(project.dist, 'api', 'books.json'))).toBe(
      false
    )
  })

  test('falls back to the default remote_url outside production', async () => {
    await setup({ config: { remote_url: '' } })
    await run()

    const [book] = await fs.readJson(
      path.join(project.dist, 'api', 'books.json')
    )
    expect(book.url).toBe('http://localhost:4000/epub/book-id')
  })

  test('passes a failure to log.error', async () => {
    await setup()
    await fs.remove(path.join(project.dist, 'mimetype'))

    await expect(reader()).resolves.toBeUndefined()
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ENOENT' })
    )
  })
})
