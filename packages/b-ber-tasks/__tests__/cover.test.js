/**
 * @jest-environment node
 */

// Node, not the root run's jsdom: under jsdom pureimage takes its browser
// path and loads the cover font over XHR, which never completes.

import path from 'node:path'
import state from '@canopycanopycanopy/b-ber-lib/State'
import { getImageDimensions } from '@canopycanopycanopy/b-ber-lib/utils'
import YamlAdaptor from '@canopycanopycanopy/b-ber-lib/YamlAdaptor'
import log from '@canopycanopycanopy/b-ber-logger'
import fs from 'fs-extra'
import { png } from './helpers/files'
import { returnReportedErrors } from './helpers/log'
import { createProject } from './helpers/project'

jest.mock('@canopycanopycanopy/b-ber-logger')

const METADATA = [
  { term: 'title', value: 'A Book' },
  { term: 'creator', value: 'An Author' },
  { term: 'publisher', value: 'A Publisher' },
  { term: 'description', value: 'About the book' },
  { term: 'identifier', value: 'book-id' },
]

// Long enough that the generated cover wraps it over several lines. Kept out
// of metadata.yml: see the YAML defect test below
const LONG_DESCRIPTION = 'About the book. '.repeat(20).trim()

// The task reads the metadata, and works out the path of metadata.yml, from
// the build's context when it runs. Both used to be read once, when the
// module was imported. The path is relative to the working directory, so the
// tests run from inside the project, as the CLI does.
const cover = require('../src/cover').default

let project

beforeEach(() => returnReportedErrors(log))

afterEach(async () => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
  if (project) await project.cleanup()
  project = undefined
})

// A project with a metadata.yml, loaded the way State loads it at startup
const setup = async ({ build = 'epub', metadata = METADATA } = {}) => {
  project = await createProject({ build, chdir: true })
  await fs.ensureDir(path.join(project.src, '_images'))
  await fs.writeFile(
    path.join(project.src, 'metadata.yml'),
    YamlAdaptor.dump(metadata)
  )
  state.loadMetadata()
}

const images = () => fs.readdir(path.join(project.src, '_images'))
const coverXhtml = () => path.join(project.dist, 'OPS', 'text', 'cover.xhtml')
const metadataYml = () =>
  YamlAdaptor.load(path.join(project.src, 'metadata.yml'))

// The tests that generate a cover image: pureimage draws and PNG-encodes a
// full-size cover in plain JavaScript, about 2.3s each on a laptop. On a CI
// runner, alongside the rest of the suite, that passed Jest's 5s default
const GENERATES_A_COVER = 30_000

describe('task: cover', () => {
  // Generating the image takes a couple of seconds, so one test checks
  // everything a generated cover produces
  test(
    'with no cover in metadata.yml, generates one and lists it',
    async () => {
      await setup()
      // Left by an earlier run: replaced, not kept
      await fs.writeFile(
        path.join(project.src, '_images', '__bber_cover__old.jpg'),
        ''
      )

      await cover(project.ctx)

      // A JPEG in _images
      const files = await images()
      expect(files).toEqual([expect.stringMatching(/^__bber_cover__\w+\.jpg$/)])
      const [image] = files
      expect(files[0]).not.toBe('__bber_cover__old.jpg')
      expect(
        getImageDimensions(path.join(project.src, '_images', image))
      ).toEqual({ width: 1600, height: 2400 })

      // Added to metadata.yml
      expect(metadataYml()).toEqual([
        ...METADATA,
        { term: 'cover', value: image },
      ])

      // And shown, at its size, in cover.xhtml
      const xhtml = await fs.readFile(coverXhtml(), 'utf8')
      expect(xhtml).toContain(`images/${image}`)
      expect(xhtml).toContain('viewBox="0 0 1600 2400"')
    },
    GENERATES_A_COVER
  )

  describe('with a cover in metadata.yml', () => {
    const withCover = (value) => [...METADATA, { term: 'cover', value }]

    test('uses the image, generating nothing', async () => {
      await setup({ metadata: withCover('mine.png') })
      await fs.writeFile(
        path.join(project.src, '_images', 'mine.png'),
        png(600, 900)
      )

      await cover(project.ctx)

      expect(await images()).toEqual(['mine.png'])
      const xhtml = await fs.readFile(coverXhtml(), 'utf8')
      expect(xhtml).toContain('images/mine.png')
      expect(xhtml).toContain('viewBox="0 0 600 900"')
      expect(metadataYml()).toEqual(withCover('mine.png'))
    })

    test('URI-encodes the file name in cover.xhtml', async () => {
      await setup({ metadata: withCover('my cover.png') })
      await fs.writeFile(
        path.join(project.src, '_images', 'my cover.png'),
        png(600, 900)
      )

      await cover(project.ctx)

      const xhtml = await fs.readFile(coverXhtml(), 'utf8')
      expect(xhtml).toContain('images/my%20cover.png')
    })

    // A value ending `_jpg` names a `.jpg` file (#208)
    test('reads a trailing _jpg as .jpg', async () => {
      await setup({ metadata: withCover('mine_jpg') })
      await fs.writeFile(
        path.join(project.src, '_images', 'mine.jpg'),
        png(600, 900)
      )

      await cover(project.ctx)

      expect(await fs.readFile(coverXhtml(), 'utf8')).toContain(
        'images/mine.jpg'
      )
    })

    test('rejects when the image does not exist', async () => {
      await setup({ metadata: withCover('missing.png') })

      await expect(cover(project.ctx)).rejects.toThrow(
        'Cover image listed in metadata.yml cannot be found'
      )
      expect(fs.existsSync(coverXhtml())).toBe(false)
    })
  })

  // Defect: the task adds the cover to metadata.yml through b-ber-lib's Yaml,
  // which uses yawn-yaml to keep the file's formatting. yawn-yaml rewrites a
  // folded (`>-`) value that has an entry after it onto one line and drops
  // the line break before that entry, so the file no longer parses. b-ber's
  // own YamlAdaptor.dump folds any value too long for one line.
  test(
    'corrupts metadata.yml that has a folded value (defect)',
    async () => {
      const folded = METADATA.map((entry) =>
        entry.term === 'description'
          ? { ...entry, value: LONG_DESCRIPTION }
          : entry
      )
      await setup({ metadata: folded })
      const file = path.join(project.src, 'metadata.yml')
      expect(await fs.readFile(file, 'utf8')).toContain('value: >-')

      await cover(project.ctx)

      expect(await fs.readFile(file, 'utf8')).toContain(
        'About the book.- term: identifier'
      )
      expect(() => YamlAdaptor.load(file)).toThrow('duplicated mapping key')
    },
    GENERATES_A_COVER
  )

  // The PDF build leaves the cover page to the project's own config
  test(
    'writes no cover.xhtml for the pdf build',
    async () => {
      await setup({ build: 'pdf' })

      await cover(project.ctx)

      expect(await images()).toHaveLength(1)
      expect(fs.existsSync(coverXhtml())).toBe(false)
    },
    GENERATES_A_COVER
  )

  test('rejects, through log.error, when _images does not exist', async () => {
    await setup()
    await fs.remove(path.join(project.src, '_images'))

    await expect(cover(project.ctx)).rejects.toMatchObject({ code: 'ENOENT' })
    expect(log.error).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'ENOENT' })
    )
  })

  // The path of metadata.yml is worked out when the task runs, from the source
  // directory of the build that is running. It was worked out once, when the
  // module was imported, until TASK-163 (pinned by TASK-153): `bber build
  // --src book` read `_project/metadata.yml`, and failed without one.
  test('reads metadata.yml from the source directory of the build that runs', async () => {
    await setup({
      metadata: [...METADATA, { term: 'cover', value: 'mine.png' }],
    })
    await fs.writeFile(
      path.join(project.src, '_images', 'mine.png'),
      png(600, 900)
    )
    await fs.move(path.join(project.root, '_project'), 'book')
    state.config.src = 'book'

    await cover(project.ctx)

    expect(await fs.readFile(coverXhtml(), 'utf8')).toContain('images/mine.png')
    expect(fs.existsSync(path.join(project.root, '_project'))).toBe(false)
  })

  // Defect: the generated cover draws `publisher` and `description` from the
  // metadata without checking they exist (src/cover/index.ts:171, 175). A
  // project whose metadata.yml lacks either, and lists no cover, throws a
  // TypeError inside pureimage's font-loading callback. Nothing catches it
  // there, so the task never settles; the CLI's uncaught-exception handler
  // exits. The task is imported afresh here, against a State that has loaded
  // such a project, and the callback is wrapped so the test sees the error.
  test(
    'never settles when metadata.yml has no publisher (defect)',
    async () => {
      const metadata = METADATA.filter(({ term }) => term !== 'publisher')
      await setup({ metadata })

      let reportThrown
      const thrown = new Promise((resolve) => {
        reportThrown = resolve
      })
      let isolatedCover
      jest.isolateModules(() => {
        const isolatedState =
          require('@canopycanopycanopy/b-ber-lib/State').default
        isolatedState.update('build', 'epub')
        isolatedState.update('builds.epub', { dist: project.dist })
        isolatedState.loadMetadata()

        const PureImage = require('pureimage')
        const registerFont = PureImage.registerFont
        jest.spyOn(PureImage, 'registerFont').mockImplementation((...args) => {
          const font = registerFont(...args)
          const load = font.load.bind(font)
          font.load = (cb) =>
            load(() => {
              try {
                cb()
              } catch (err) {
                reportThrown(err)
              }
            })
          return font
        })

        isolatedCover = require('../src/cover').default
      })

      const result = isolatedCover(project.ctx).then(
        () => 'settled',
        () => 'settled'
      )

      await expect(thrown).resolves.toBeInstanceOf(TypeError)
      const pending = new Promise((resolve) =>
        setTimeout(resolve, 50, 'pending')
      )
      expect(await Promise.race([result, pending])).toBe('pending')
    },
    GENERATES_A_COVER
  )
})
