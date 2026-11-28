import path from 'node:path'
import { SpineItem } from '@canopycanopycanopy/b-ber-lib'
import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import opf, { ManifestAndMetadata, Navigation, Opf } from '../src/opf'
import { returnReportedErrors } from './helpers/log'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

beforeEach(() => returnReportedErrors(log))

let manifestAndMetadata

let src = 'src'
let dist = 'dist'
let version = '0.0.0'

afterAll(() => Promise.all([fs.remove('_project'), fs.remove('themes')]))

describe('Opf', () => {
  test('it loads the module', () => {
    expect(Opf).toBeFunction()
    expect(ManifestAndMetadata).toBeFunction()
    expect(Navigation).toBeFunction()
  })
})

describe('ManifestAndMetadata', () => {
  beforeAll(() => {
    manifestAndMetadata = new ManifestAndMetadata()

    Object.defineProperties(manifestAndMetadata, {
      src: {
        get: () => src,
        set: (val) => (src = val),
        enumerable: true,
        configurable: true,
      },
      dist: {
        get: () => dist,
        set: (val) => (dist = val),
        enumerable: true,
        configurable: true,
      },
      version: {
        get: () => version,
        set: (val) => (version = val),
        enumerable: true,
        configurable: true,
      },
      bookmeta: {
        get: () => [],
        set: () => {},
        enumerable: true,
        configurable: true,
      },
    })

    manifestAndMetadata.src = src
    manifestAndMetadata.dist = dist
    manifestAndMetadata.version = version
  })

  test('it loads the module', () => {
    expect(ManifestAndMetadata).toBeFunction()
  })

  test('it is properly configured', () => {
    expect(manifestAndMetadata.src).toBe(src)
    expect(manifestAndMetadata.dist).toBe(dist)
    expect(manifestAndMetadata.version).toBe(version)

    manifestAndMetadata
      .loadMetadata()
      .then(() => expect(manifestAndMetadata.bookmeta).toEqual([]))
  })
})

// The tests below run against a real project in a temp directory

const METADATA = [
  { term: 'title', value: 'A & B' },
  { term: 'creator', value: 'An Author' },
  { term: 'identifier', value: 'book-id' },
  { term: 'language', value: 'en' },
]

let project

// Write the files a build has produced by the time the opf task runs
const writeOps = async (files) => {
  await Promise.all(
    Object.entries(files).map(([rel, body]) =>
      fs.outputFile(path.join(project.dist, 'OPS', rel), body)
    )
  )
}

// Every opf test needs the directories the inject step reads
const scaffoldOps = () =>
  Promise.all([
    fs.ensureDir(path.join(project.dist, 'OPS', 'stylesheets')),
    fs.ensureDir(path.join(project.dist, 'OPS', 'javascripts')),
  ])

afterEach(async () => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
  if (project) await project.cleanup()
  project = undefined
})

describe('ManifestAndMetadata, against a project', () => {
  beforeEach(async () => {
    project = await createProject({ toc: ['one'], metadata: METADATA })
  })

  test('loadMetadata reads the metadata from State', async () => {
    const mm = new ManifestAndMetadata()
    await mm.loadMetadata()
    expect(mm.bookmeta).toEqual(METADATA)
  })

  test('lists remote assets first, then every non-dot file under OPS', async () => {
    await writeOps({
      'text/one.xhtml': '',
      'images/a.png': '',
      'images/.DS_Store': '',
    })
    state.remoteAssets = ['https://example.com/video.mp4']

    const files =
      await new ManifestAndMetadata().createManifestObjectFromAssets()

    expect(files[0]).toEqual({
      absolutePath: 'https://example.com/video.mp4',
      opsPath: 'https://example.com/video.mp4',
      name: 'https://example.com/video.mp4',
      extension: '',
      remote: true,
    })
    expect(
      files
        .slice(1)
        .map((f) => f.opsPath)
        .sort()
    ).toEqual(['images/a.png', 'text/one.xhtml'])
    expect(files.find((f) => f.name === 'a.png')).toEqual({
      absolutePath: path.join(project.dist, 'OPS', 'images', 'a.png'),
      opsPath: 'images/a.png',
      name: 'a.png',
      extension: '.png',
      remote: false,
    })
  })

  test('builds manifest items and metadata entries from templates', async () => {
    const mm = new ManifestAndMetadata()
    await mm.loadMetadata()

    const { manifest, bookmeta } = mm.createManifestAndMetadataFromTemplates([
      {
        absolutePath: '/x/OPS/images/a.png',
        opsPath: 'images/a.png',
        name: 'a.png',
        extension: '.png',
        remote: false,
      },
    ])

    expect(manifest).toEqual([
      '<item id="_a_png" href="images/a.png" media-type="image/png" />',
    ])
    // One entry per metadata term, each both a dcterms meta and a dc element
    expect(bookmeta).toHaveLength(METADATA.length + 3)
    expect(bookmeta[0]).toMatch(
      /^<meta property="dcterms:title">A &amp; B<\/meta><dc:title id="_[0-9a-f]{16}">A &amp; B<\/dc:title>$/
    )
    // The identifier's element carries the id the package element refers to
    expect(bookmeta[2]).toBe(
      '<meta property="dcterms:identifier">book-id</meta><dc:identifier id="uuid">book-id</dc:identifier>'
    )

    // The three entries every OPF gets, after the user's
    const [fonts, modified, generator] = bookmeta.slice(-3)
    expect(fonts).toBe('<meta property="ibooks:specified-fonts">false</meta>')
    expect(modified).toMatch(
      /^<meta property="dcterms:modified">\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ<\/meta>$/
    )
    expect(generator).toBe(
      `<meta name="generator" content="b-ber@${state.version}" />`
    )
  })

  test('sets ibooks:specified-fonts only when the config says exactly true', () => {
    const mm = new ManifestAndMetadata()

    state.config.ibooks_specified_fonts = true
    expect(mm.createManifestAndMetadataFromTemplates([]).bookmeta).toContain(
      '<meta property="ibooks:specified-fonts">true</meta>'
    )

    state.config.ibooks_specified_fonts = 'yes'
    expect(mm.createManifestAndMetadataFromTemplates([]).bookmeta).toContain(
      '<meta property="ibooks:specified-fonts">false</meta>'
    )
  })

  test('wraps the entries in <metadata> and <manifest>', () => {
    const xml = new ManifestAndMetadata().createManifestAndMetadataXML({
      manifest: ['<item a/>', '', '<item b/>'],
      bookmeta: ['<meta a/>', '<meta b/>'],
    })

    expect(xml).toEqual({
      metadata: '<metadata><meta a/><meta b/></metadata>',
      manifest: '<manifest><item a/><item b/></manifest>',
    })
  })

  test('init resolves to the metadata and manifest XML', async () => {
    await writeOps({ 'text/one.xhtml': '' })

    const { metadata, manifest } = await new ManifestAndMetadata().init()

    expect(metadata).toStartWith('<metadata>')
    expect(metadata).toContain('<dc:language')
    expect(manifest).toBe(
      '<manifest><item id="_one_xhtml" href="text/one.xhtml" media-type="application/xhtml+xml" /></manifest>'
    )
  })

  test('init passes a failure to log.error and rejects with it', async () => {
    // No OPS directory: recursive-readdir fails
    await expect(new ManifestAndMetadata().init()).rejects.toMatchObject({
      code: 'ENOENT',
    })
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ENOENT' })
    )
  })
})

describe('Navigation', () => {
  const tocYml = () => fs.readFile(path.join(project.src, 'toc.yml'), 'utf8')

  test('createEmptyNavDocuments truncates toc.ncx and toc.xhtml', async () => {
    project = await createProject({ toc: ['one'] })
    await writeOps({ 'toc.ncx': 'old', 'toc.xhtml': 'old' })

    await Navigation.createEmptyNavDocuments()

    expect(await fs.readFile(state.dist.ops('toc.ncx'), 'utf8')).toBe('')
    expect(await fs.readFile(state.dist.ops('toc.xhtml'), 'utf8')).toBe('')
  })

  describe('compareXhtmlWithYaml', () => {
    test('changes nothing when the TOC and the files agree', async () => {
      project = await createProject({ toc: ['one', 'two'] })
      await writeOps({ 'text/one.xhtml': '', 'text/two.xhtml': '' })
      const before = await tocYml()

      await Navigation.compareXhtmlWithYaml()

      expect(await tocYml()).toBe(before)
      expect(log.warn).not.toHaveBeenCalled()
      expect(log.error).not.toHaveBeenCalled()
    })

    test('appends files missing from the TOC to toc.yml', async () => {
      project = await createProject({ toc: ['one'] })
      await writeOps({ 'text/one.xhtml': '', 'text/extra.xhtml': '' })

      await Navigation.compareXhtmlWithYaml()

      expect(await tocYml()).toBe('- one\n- extra')
      expect(log.warn).toHaveBeenCalledWith(
        'opf [%s] was not declared in the TOC. Adding [%s] to [%s]',
        'extra',
        'extra',
        'toc.yml'
      )
    })

    test('writes non-default attributes of a spine entry with its name', async () => {
      project = await createProject({ toc: ['one'] })
      await writeOps({ 'text/one.xhtml': '', 'text/extra.xhtml': '' })
      state.spine.flattened.push({
        name: 'extra',
        fileName: 'extra',
        linear: false,
        in_toc: false,
      })

      await Navigation.compareXhtmlWithYaml()

      expect(await tocYml()).toBe(
        '- one\n- extra:\n    linear: false\n    in_toc: false'
      )
    })

    test('writes only the name of a spine entry with default attributes', async () => {
      project = await createProject({ toc: ['one'] })
      await writeOps({ 'text/one.xhtml': '', 'text/extra.xhtml': '' })
      state.spine.flattened.push({
        name: 'extra',
        fileName: 'extra',
        linear: true,
        in_toc: true,
      })

      await Navigation.compareXhtmlWithYaml()

      expect(await tocYml()).toBe('- one\n- extra')
    })

    test('does not add figure pages listed in the loi', async () => {
      project = await createProject({ toc: ['one'] })
      await writeOps({ 'text/one.xhtml': '', 'text/figure-1.xhtml': '' })
      state.loi = [{ name: 'figure-1' }]

      await Navigation.compareXhtmlWithYaml()

      expect(await tocYml()).toBe('- one')
    })

    test('reports TOC entries with no file through log.error', async () => {
      project = await createProject({ toc: ['one', 'gone'] })
      await writeOps({ 'text/one.xhtml': '' })

      // It throws before it returns its Promise
      expect(() => Navigation.compareXhtmlWithYaml()).toThrow('[gone]')

      expect(log.error).toHaveBeenCalledTimes(1)
      const [message] = log.error.mock.calls[0]
      expect(message).toContain(
        'The following entries must be removed manually from [toc.yml]'
      )
      expect(message).toContain('[gone]')
      expect(message).not.toContain('[one]')
    })

    test('reads and writes the build-specific <build>.yml when there is one', async () => {
      project = await createProject({ toc: ['one'] })
      await fs.writeFile(path.join(project.src, 'epub.yml'), '- one')
      await writeOps({ 'text/one.xhtml': '', 'text/extra.xhtml': '' })

      await Navigation.compareXhtmlWithYaml()

      expect(
        await fs.readFile(path.join(project.src, 'epub.yml'), 'utf8')
      ).toBe('- one\n- extra')
      expect(await tocYml()).toBe('- one')
    })

    test('ignores a missing cover entry in a pdf build', async () => {
      project = await createProject({ build: 'pdf', toc: ['cover', 'one'] })
      await writeOps({ 'text/one.xhtml': '' })

      await Navigation.compareXhtmlWithYaml()

      expect(log.error).not.toHaveBeenCalled()
    })

    test('reports a missing cover entry in other builds', async () => {
      project = await createProject({ toc: ['cover', 'one'] })
      await writeOps({ 'text/one.xhtml': '' })

      expect(() => Navigation.compareXhtmlWithYaml()).toThrow('[cover]')

      expect(log.error).toHaveBeenCalledWith(expect.stringContaining('[cover]'))
    })
  })

  describe('template strings', () => {
    beforeEach(async () => {
      project = await createProject({
        toc: ['one', { two: { linear: false } }],
        metadata: METADATA,
      })
      await scaffoldOps()
    })

    test('createTocStringsFromTemplate renders the TOC page', async () => {
      const toc = await Navigation.createTocStringsFromTemplate()

      expect(toc).toContain('<html')
      expect(toc).toContain('href="text/one.xhtml"')
      expect(toc).toContain('href="text/two.xhtml"')
    })

    test('createNcxStringsFromTemplate renders the NCX from the TOC', () => {
      const ncx = Navigation.createNcxStringsFromTemplate()

      expect(ncx).toContain('<meta name="dtb:uid" content="book-id"/>')
      expect(ncx).toContain('<text>A &amp; B</text>')
      expect(ncx).toContain('<content src="text/one.xhtml" />')
      expect(ncx).toContain('<navPoint id="navPoint-2" playOrder="2">')
    })

    test('createGuideStringsFromTemplate renders guide items with a type', () => {
      state.guide = [
        { fileName: 'one.xhtml', type: 'bodymatter', title: 'One' },
        { fileName: 'two.xhtml', title: 'Two' },
      ]

      expect(Navigation.createGuideStringsFromTemplate()).toBe(
        '<guide><reference type="bodymatter" title="One" href="text/one.xhtml"/></guide>'
      )
    })

    test('createSpineStringsFromTemplate renders the spine in order', () => {
      expect(Navigation.createSpineStringsFromTemplate()).toBe(
        '<spine toc="_toc_ncx"><itemref idref="_one_xhtml" linear="yes"/><itemref idref="_two_xhtml" linear="no"/></spine>'
      )
    })

    test('createSpineStringsFromTemplate moves generated entries to the end', () => {
      const generated = new SpineItem({
        fileName: 'generated',
        dist: 'project-epub',
        generated: true,
      })
      state.spine.flattened.unshift(generated)

      expect(Navigation.createSpineStringsFromTemplate()).toBe(
        '<spine toc="_toc_ncx"><itemref idref="_one_xhtml" linear="yes"/><itemref idref="_two_xhtml" linear="no"/><itemref idref="_generated_xhtml" linear="yes"/></spine>'
      )
      // It reorders State's spine in place
      expect(state.spine.flattened.map((e) => e.fileName)).toEqual([
        'one',
        'two',
        'generated',
      ])
    })

    test('createSpineStringsFromTemplate drops a generated duplicate of a declared entry', () => {
      state.spine.flattened.push(
        new SpineItem({
          fileName: 'one',
          dist: 'project-epub',
          generated: true,
        })
      )

      expect(Navigation.createSpineStringsFromTemplate()).toBe(
        '<spine toc="_toc_ncx"><itemref idref="_one_xhtml" linear="yes"/><itemref idref="_two_xhtml" linear="no"/></spine>'
      )
    })
  })

  test('writeFiles writes toc.xhtml and toc.ncx and passes the spine and guide on', async () => {
    project = await createProject({ toc: ['one'] })
    await fs.ensureDir(path.join(project.dist, 'OPS'))

    const result = await Navigation.writeFiles(['TOC', 'NCX', 'GUIDE', 'SPINE'])

    expect(result).toEqual({ spine: 'SPINE', guide: 'GUIDE' })
    expect(await fs.readFile(state.dist.ops('toc.xhtml'), 'utf8')).toBe('TOC')
    expect(await fs.readFile(state.dist.ops('toc.ncx'), 'utf8')).toBe('NCX')
  })

  test('init writes the navigation documents and resolves to the spine and guide', async () => {
    project = await createProject({ toc: ['one'], metadata: METADATA })
    await scaffoldOps()
    await writeOps({ 'text/one.xhtml': '' })

    const { spine, guide } = await Navigation.init()

    expect(spine).toContain('idref="_one_xhtml"')
    expect(guide).toBe('<guide></guide>')
    expect(await fs.readFile(state.dist.ops('toc.ncx'), 'utf8')).toContain(
      '<ncx'
    )
    expect(await fs.readFile(state.dist.ops('toc.xhtml'), 'utf8')).toContain(
      'text/one.xhtml'
    )
  })

  test('init passes a failure to log.error and rejects with it', async () => {
    project = await createProject({ toc: ['one'] })
    // No OPS directory: the nav documents cannot be written

    await expect(Navigation.init()).rejects.toMatchObject({ code: 'ENOENT' })
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ENOENT' })
    )
  })
})

describe('Opf.createOpf', () => {
  test('is the default export', () => {
    expect(opf).toBe(Opf.createOpf)
  })

  test('writes content.opf with metadata, manifest, spine and guide', async () => {
    project = await createProject({ toc: ['one'], metadata: METADATA })
    await scaffoldOps()
    // toc.ncx and toc.xhtml exist up front so the manifest lists them
    // whichever way the race in the defect test below goes
    await writeOps({ 'text/one.xhtml': '', 'toc.ncx': '', 'toc.xhtml': '' })

    await opf()

    const contents = await fs.readFile(state.dist.ops('content.opf'), 'utf8')
    expect(contents).toStartWith('<?xml version="1.0" encoding="UTF-8"?>')
    expect(contents).toContain('<package')
    expect(contents).toContain(
      '<dc:identifier id="uuid">book-id</dc:identifier>'
    )
    expect(contents).toContain('href="text/one.xhtml"')
    expect(contents).toContain('href="toc.ncx"')
    expect(contents).toContain('<itemref idref="_one_xhtml" linear="yes"/>')
    expect(contents).toContain('<guide></guide>')
  })

  // DEFECT (#768): createOpf (src/opf/Opf.ts:31) runs ManifestAndMetadata.init and
  // Navigation.init concurrently. The manifest is a directory scan of OPS,
  // and toc.ncx and toc.xhtml are first created by Navigation's
  // createEmptyNavDocuments, so nothing guarantees they exist when the scan
  // runs. In a clean build the manifest can omit both: the spine's
  // toc="_toc_ncx" then names no manifest item and the EPUB has no nav
  // document. Here the nav documents are held back until the scan is done,
  // one of the orders the two can run in.
  test('can omit toc.ncx and toc.xhtml from the manifest (defect)', async () => {
    project = await createProject({ toc: ['one'], metadata: METADATA })
    await scaffoldOps()
    await writeOps({ 'text/one.xhtml': '' })

    const scan = ManifestAndMetadata.prototype.createManifestObjectFromAssets
    let scanned
    const scanDone = new Promise((resolve) => {
      scanned = resolve
    })
    jest
      .spyOn(ManifestAndMetadata.prototype, 'createManifestObjectFromAssets')
      .mockImplementation(function scanThenSignal() {
        return scan.call(this).then((files) => {
          scanned()
          return files
        })
      })
    const createEmpty = Navigation.createEmptyNavDocuments
    jest
      .spyOn(Navigation, 'createEmptyNavDocuments')
      .mockImplementation(() => scanDone.then(createEmpty))

    await opf()

    const contents = await fs.readFile(state.dist.ops('content.opf'), 'utf8')
    expect(fs.existsSync(state.dist.ops('toc.ncx'))).toBe(true)
    expect(contents).not.toContain('href="toc.ncx"')
    expect(contents).not.toContain('href="toc.xhtml"')
    expect(contents).toContain('<spine toc="_toc_ncx">')
  })

  test('createOpfPackageString throws when either part is missing', () => {
    expect(() =>
      Opf.createOpfPackageString([undefined, { spine: '', guide: '' }])
    ).toThrow(TypeError)
  })

  test('writeOPF writes the string to OPS/content.opf', async () => {
    project = await createProject()
    await fs.ensureDir(path.join(project.dist, 'OPS'))

    await Opf.writeOPF('<package/>')

    expect(await fs.readFile(state.dist.ops('content.opf'), 'utf8')).toBe(
      '<package/>'
    )
  })

  test('passes a failure to log.error and rejects with it', async () => {
    project = await createProject({ toc: ['one'] })

    await expect(opf()).rejects.toThrow()

    expect(log.error).toHaveBeenCalled()
    expect(fs.existsSync(state.dist.ops('content.opf'))).toBe(false)
  })
})
