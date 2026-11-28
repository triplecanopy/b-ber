import path from 'node:path'
import { SpineItem } from '@canopycanopycanopy/b-ber-lib'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import web from '../src/web'
import Template from '../src/web/Template'
import { returnReportedErrors } from './helpers/log'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

beforeEach(() => returnReportedErrors(log))

// The root config runs under jsdom, whose export conditions resolve cheerio
// to its browser ESM build, which Jest cannot load. Its Node build imports
// undici, which needs web streams jsdom does not have. The slim build is the
// same `load` API without the network code, so the task gets real cheerio
jest.mock('cheerio', () =>
  jest.requireActual(
    require('node:path').join(
      require.resolve('cheerio/package.json', {
        paths: [require('node:path').join(__dirname, '..')],
      }),
      '../dist/commonjs/slim.js'
    )
  )
)

const BASE_URL = 'https://example.com/book/'

const METADATA = [
  { term: 'title', value: 'A Book' },
  { term: 'creator', value: 'An Author' },
  { term: 'identifier', value: 'book-id' },
  { term: 'cover', value: 'cover.jpg' },
]

const page = (heading, text) =>
  `<?xml version="1.0"?><html><head><title></title></head><body><h1>${heading}</h1><p>${text}</p></body></html>`

let project

// What the epub-style build steps leave in the build directory by the time
// the web task runs
const writeEpubBuild = async (pages) => {
  const files = {
    mimetype: 'application/epub+zip',
    'META-INF/container.xml': '<container/>',
    'OPS/content.opf': '<package/>',
    'OPS/toc.ncx': '<ncx/>',
    'OPS/toc.xhtml': page('Contents', ''),
    'OPS/stylesheets/application.css': 'body {}',
    'OPS/images/cover.jpg': '',
    ...Object.fromEntries(
      Object.entries(pages).map(([name, body]) => [
        `OPS/text/${name}.xhtml`,
        body,
      ])
    ),
  }
  await Promise.all(
    Object.entries(files).map(([rel, body]) =>
      fs.outputFile(path.join(project.dist, rel), body)
    )
  )
}

const setup = async ({ toc = ['one', 'two'], pages, ...options } = {}) => {
  project = await createProject({
    build: 'web',
    toc,
    metadata: METADATA,
    config: { base_url: 'https://example.com/book' },
    ...options,
  })
  await writeEpubBuild(
    pages ?? {
      one: page('One', 'first page'),
      two: page('Two', 'second page'),
    }
  )
}

const dist = (...parts) => path.join(project.dist, ...parts)
const read = (...parts) => fs.readFile(dist(...parts), 'utf8')

beforeEach(() => {
  // State logs while it initialises at import, before any test
  jest.clearAllMocks()
})

afterEach(async () => {
  if (project) await project.cleanup()
  project = undefined
})

describe('task: web', () => {
  test('removes the EPUB-only files', async () => {
    await setup()
    await web(project.ctx, {
      spine: state.spine,
      loi: state.loi,
      toc: state.toc,
    })

    expect(fs.existsSync(dist('mimetype'))).toBe(false)
    expect(fs.existsSync(dist('META-INF'))).toBe(false)
    expect(fs.existsSync(dist('OPS'))).toBe(false)
    expect(log.error).not.toHaveBeenCalled()
  })

  test('moves the OPS directories to the root of the site', async () => {
    await setup()
    await web(project.ctx, {
      spine: state.spine,
      loi: state.loi,
      toc: state.toc,
    })

    expect(fs.existsSync(dist('text', 'one.xhtml'))).toBe(true)
    expect(fs.existsSync(dist('stylesheets', 'application.css'))).toBe(true)
    expect(fs.existsSync(dist('images', 'cover.jpg'))).toBe(true)
    // Files directly under OPS go with it
    expect(fs.existsSync(dist('toc.xhtml'))).toBe(false)
  })

  test('writes a search index of the linear pages', async () => {
    await setup({ toc: ['one', 'two', { three: { linear: false } }] })
    await writeEpubBuild({ three: page('Three', 'not linear') })
    await web(project.ctx, {
      spine: state.spine,
      loi: state.loi,
      toc: state.toc,
    })

    const records = JSON.parse(await read('search-index.json'))
    // DEFECT (#771): `indexPageContent` (src/web/index.ts:311) numbers and pushes
    // each record as its file finishes reading, so the ids and the order of
    // search-index.json follow I/O completion, not the spine, and can differ
    // between two builds of the same book. Compare without them
    expect(records.map((r) => r.id).sort()).toEqual([0, 1])
    expect(
      records
        .map(({ id, ...rest }) => rest)
        .sort((a, b) => a.url.localeCompare(b.url))
    ).toEqual([
      {
        title: 'One',
        body: 'Onefirst page',
        url: `${BASE_URL}text/one.xhtml`,
      },
      {
        title: 'Two',
        body: 'Twosecond page',
        url: `${BASE_URL}text/two.xhtml`,
      },
    ])
  })

  test('leaves the toc out of the search index and the pagination', async () => {
    await setup({ toc: ['toc', 'one'] })
    await web(project.ctx, {
      spine: state.spine,
      loi: state.loi,
      toc: state.toc,
    })

    const records = JSON.parse(await read('search-index.json'))
    expect(records.map((r) => r.url)).toEqual([`${BASE_URL}text/one.xhtml`])
    expect(await read('text', 'one.xhtml')).not.toContain(
      'publication__nav__prev'
    )
  })

  test('wraps each page in the site chrome', async () => {
    await setup()
    await web(project.ctx, {
      spine: state.spine,
      loi: state.loi,
      toc: state.toc,
    })

    const html = await read('text', 'one.xhtml')
    expect(html).toContain('<body style="opacity: 0;">')
    expect(html).toContain('<header class="publication__header"')
    expect(html).toContain('<div class="publication__contents">')
    expect(html).toContain('<h1>One</h1><p>first page</p>')
    expect(html).toContain('<nav class="publication__toc"')
    expect(html).toContain('<nav class="publication__info"')
    expect(html).toContain('<dt>creator</dt>')
    expect(html).toContain('<dd>An Author</dd>')
    // The footer template ends with `$1`, which puts the matched </body> back
    expect(html).toMatch(/<\/body>\s*<\/html>$/)
    expect(html.match(/<\/body>/g)).toHaveLength(1)
  })

  test('links each page to the next and previous pages in the spine', async () => {
    await setup({
      toc: ['one', 'two', 'three'],
      pages: {
        one: page('One', ''),
        two: page('Two', ''),
        three: page('Three', ''),
      },
    })
    await web(project.ctx, {
      spine: state.spine,
      loi: state.loi,
      toc: state.toc,
    })

    const one = await read('text', 'one.xhtml')
    const two = await read('text', 'two.xhtml')
    const three = await read('text', 'three.xhtml')

    expect(one).not.toContain('publication__nav__prev')
    expect(one).toContain(`href="${BASE_URL}text/two.xhtml"`)
    expect(two).toContain(`href="${BASE_URL}text/one.xhtml"`)
    expect(two).toContain(`href="${BASE_URL}text/three.xhtml"`)
    expect(three).toContain(`href="${BASE_URL}text/two.xhtml"`)
    expect(three).not.toContain('publication__nav__next')
  })

  test('prefixes the TOC links with the base URL', async () => {
    await setup()
    await web(project.ctx, {
      spine: state.spine,
      loi: state.loi,
      toc: state.toc,
    })

    expect(await read('text', 'one.xhtml')).toContain(
      `<a href="${BASE_URL}text/one.xhtml">One</a>`
    )
  })

  test('inlines the browser scripts with the base URL filled in', async () => {
    await setup()
    await web(project.ctx, {
      spine: state.spine,
      loi: state.loi,
      toc: state.toc,
    })

    const html = await read('text', 'one.xhtml')
    expect(html).not.toContain('%BASE_URL%')
    expect(html).toContain('<script type="text/javascript">')
    expect(await read('worker.js')).not.toContain('%BASE_URL%')
  })

  test('titles the header with the page title from front matter, else the book title', async () => {
    await setup()
    state.spine.frontMatter.set('two', { title: 'Chapter Two' })
    await web(project.ctx, {
      spine: state.spine,
      loi: state.loi,
      toc: state.toc,
    })

    expect(await read('text', 'one.xhtml')).toContain('<h1>A Book</h1>')
    expect(await read('text', 'two.xhtml')).toContain('<h1>Chapter Two</h1>')
  })

  test('writes an index.html with the cover linking to the first page', async () => {
    await setup()
    await web(project.ctx, {
      spine: state.spine,
      loi: state.loi,
      toc: state.toc,
    })

    const html = await read('index.html')
    expect(html).toContain('<title>A Book</title>')
    expect(html).toContain(
      `<a class="cover__image__link" href="${BASE_URL}text/one.xhtml">`
    )
    expect(html).toContain('src="images/cover.jpg"')
    expect(html).toContain('<meta name="robots" content="index,follow"/>')
    expect(html).toContain(`href="${BASE_URL}stylesheets/application.css"`)
  })

  test('marks a private project noindex', async () => {
    await setup({ config: { base_url: BASE_URL, private: true } })
    await web(project.ctx, {
      spine: state.spine,
      loi: state.loi,
      toc: state.toc,
    })

    expect(await read('index.html')).toContain(
      '<meta name="robots" content="noindex,nofollow"/>'
    )
  })

  test('points the cover at the images directory when there is no cover', async () => {
    await setup({ metadata: METADATA.filter((m) => m.term !== 'cover') })
    await web(project.ctx, {
      spine: state.spine,
      loi: state.loi,
      toc: state.toc,
    })

    expect(await read('index.html')).toContain('src="images/"')
  })

  test('copies lunr, the web worker and a webpub manifest into the site', async () => {
    await setup()
    await web(project.ctx, {
      spine: state.spine,
      loi: state.loi,
      toc: state.toc,
    })

    expect(await read('lunr.js')).toContain('lunr')
    expect(fs.existsSync(dist('worker.js'))).toBe(true)

    const manifest = JSON.parse(await read('manifest.json'))
    expect(manifest.metadata.title).toBe('A Book')
    expect(manifest.readingOrder.map((r) => path.basename(r.href))).toEqual([
      'one.xhtml',
      'two.xhtml',
    ])
  })

  test('adds the loi figure pages to the flow after figures-titlepage', async () => {
    await setup({
      toc: ['one', 'figures-titlepage', 'two'],
      pages: {
        one: page('One', ''),
        'figures-titlepage': page('Figures', ''),
        'figure-1': page('Figure 1', 'a figure'),
        two: page('Two', ''),
      },
    })
    // The loi task names figure pages with their extension
    state.loi = [
      new SpineItem({ fileName: 'figure-1.xhtml', dist: state.distDir }),
    ]
    await web(project.ctx, {
      spine: state.spine,
      loi: state.loi,
      toc: state.toc,
    })

    const figure = await read('text', 'figure-1.xhtml')
    expect(figure).toContain(`href="${BASE_URL}text/figures-titlepage.xhtml"`)
    expect(figure).toContain(`href="${BASE_URL}text/two.xhtml"`)

    const records = JSON.parse(await read('search-index.json'))
    expect(records.map((r) => r.title).sort()).toEqual([
      'Figure 1',
      'Figures',
      'One',
      'Two',
    ])
  })

  test('leaves the loi out of the flow when there is no figures-titlepage', async () => {
    await setup()
    await writeEpubBuild({ 'figure-1': page('Figure 1', '') })
    state.loi = [
      new SpineItem({ fileName: 'figure-1.xhtml', dist: state.distDir }),
    ]
    await web(project.ctx, {
      spine: state.spine,
      loi: state.loi,
      toc: state.toc,
    })

    const records = JSON.parse(await read('search-index.json'))
    expect(records.map((r) => r.title).sort()).toEqual(['One', 'Two'])
  })

  test('passes a failure to log.error and rejects with it', async () => {
    await setup()
    await fs.remove(dist('OPS', 'text', 'two.xhtml'))

    await expect(
      web(project.ctx, { spine: state.spine, loi: state.loi, toc: state.toc })
    ).rejects.toMatchObject({ code: 'ENOENT' })
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ENOENT' })
    )
  })
})

describe('web Template', () => {
  test('robots allows indexing unless the project is private', () => {
    expect(Template.robots(false)).toBe(
      '<meta name="robots" content="index,follow"/>'
    )
    expect(Template.robots(true)).toBe(
      '<meta name="robots" content="noindex,nofollow"/>'
    )
  })

  test('metadata renders a definition list', () => {
    const html = Template.metadata([
      { term: 'title', value: 'A' },
      { term: 'creator', value: 'B' },
    ])
    expect(html.replace(/\s+/g, '')).toBe(
      '<dl><dt>title</dt><dd>A</dd><dt>creator</dt><dd>B</dd></dl>'
    )
  })

  test('prev and next link into text/', () => {
    expect(Template.prev('/b/', 'one.xhtml')).toContain(
      'href="/b/text/one.xhtml"'
    )
    expect(Template.next('/b/', 'two.xhtml')).toContain(
      'href="/b/text/two.xhtml"'
    )
  })

  test('scripts wraps its content in CDATA', () => {
    expect(Template.scripts('var a')).toMatch(
      /<script type="text\/javascript">\s*\/\/ <!\[CDATA\[\s*var a\s*\/\/ \]\]>\s*<\/script>/
    )
  })
})
