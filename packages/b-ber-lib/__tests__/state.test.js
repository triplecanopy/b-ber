import fs from 'fs-extra'

jest.mock('../src/Spine')
jest.mock('../src/SpineItem')

// Since the State module exports an instance of state, and checks are done in
// State's constructor against the file system, we create the necessary dirs in
// `beforeAll` to run tests and remove them in teardown

let state

beforeAll(
  () =>
    fs
      .mkdirp('_project/_media')
      .then(() => (state = require('../src/State').default)) // eslint-disable-line global-require
)

afterAll(() => Promise.all([fs.remove('_project'), fs.remove('themes')]))

describe('State', () => {
  it('adds to an array or object', () => {
    state.reset()

    const a = 'foo'
    const o = { foo: 1 }

    state.add('sequence', a)
    state.add('video', o)

    expect(state.sequence.length).toBe(1)
    expect(state.video.length).toBe(1)
    expect(state.video[0]).toHaveProperty('foo')
  })

  it('removes from an array or object', () => {
    state.reset()
    state.add('sequence', { foo: 1 })
    state.remove('sequence', { foo: 1 })
    expect(state.sequence).toEqual([])
  })

  it('merges two objects', () => {
    state.reset()
    state.merge('buildTypes', { foo: 1 })
    state.merge('buildTypes', { bar: 2 })
    expect(state.buildTypes).toHaveProperty('foo', 1)
    expect(state.buildTypes).toHaveProperty('bar', 2)
  })

  it('updates a value', done => {
    state.reset()
    const addFoo = callback => {
      state.add('sequence', 'foo')
      callback()
    }

    addFoo(() => {
      state.update('sequence', ['bar'])
      expect(state.sequence.length).toBe(1)
      expect(state.sequence).toContain('bar')
      done()
    })
  })

  it('add() concatenates string values', () => {
    state.reset()
    state.update('build', 'epub')
    state.add('build', '-test')
    expect(state.build).toBe('epub-test')
  })

  it('remove() removes a key from a plain object', () => {
    state.reset()
    state.merge('buildTypes', { foo: 1, bar: 2 })
    state.remove('buildTypes', 'foo')
    expect(state.buildTypes).not.toHaveProperty('foo')
    expect(state.buildTypes).toHaveProperty('bar', 2)
  })

  it('has() returns true for a known property', () => {
    state.reset()
    expect(state.has('sequence')).toBe(true)
  })

  it('has() returns false for an unknown property', () => {
    state.reset()
    expect(state.has('__nonexistent__')).toBe(false)
  })

  it('find() returns the matching entry from a collection', () => {
    state.reset()
    state.add('sequence', { id: 'a' })
    state.add('sequence', { id: 'b' })
    expect(state.find('sequence', { id: 'b' })).toEqual({ id: 'b' })
  })

  it('indexOf() returns the index of a matching entry', () => {
    state.reset()
    state.add('sequence', { id: 'a' })
    state.add('sequence', { id: 'b' })
    expect(state.indexOf('sequence', { id: 'b' })).toBe(1)
  })

  it('contains() returns true when the entry exists', () => {
    state.reset()
    state.add('sequence', { id: 'x' })
    expect(state.contains('sequence', { id: 'x' })).toBe(true)
  })

  it('contains() returns false when the entry does not exist', () => {
    state.reset()
    expect(state.contains('sequence', { id: 'missing' })).toBe(false)
  })
})

describe('State getters and setters', () => {
  beforeEach(() => {
    // When Jest workers run with argv.length < 3, skipInitialization() returns true
    // and loadBuildSettings returns undefined, leaving builds[type] undefined.
    // Ensure each build bucket has the required structure for getter/setter tests.
    const buildTypes = ['sample', 'epub', 'mobi', 'pdf', 'web', 'reader']
    buildTypes.forEach(type => {
      if (!state.builds[type]) {
        state.builds[type] = {
          dist: `project-${type}`,
          guide: [],
          spine: null,
          toc: [],
          cursor: [],
          figures: [],
          footnotes: [],
          remoteAssets: [],
          loi: [],
          config: {},
        }
      }
    })
  })

  it('spine getter/setter round-trips via builds[build]', () => {
    state.build = 'epub'
    const mockSpine = { flattened: [], nested: [] }
    state.spine = mockSpine
    expect(state.spine).toBe(mockSpine)
  })

  it('guide getter/setter round-trips', () => {
    state.build = 'epub'
    state.guide = ['guide-item']
    expect(state.guide).toEqual(['guide-item'])
  })

  it('figures getter/setter round-trips', () => {
    state.build = 'epub'
    state.figures = [{ id: 'fig-1' }]
    expect(state.figures).toEqual([{ id: 'fig-1' }])
  })

  it('footnotes getter/setter round-trips', () => {
    state.build = 'epub'
    state.footnotes = [{ id: 'fn-1' }]
    expect(state.footnotes).toEqual([{ id: 'fn-1' }])
  })

  it('cursor getter/setter round-trips', () => {
    state.build = 'epub'
    state.cursor = [{ chapter: 'ch01' }]
    expect(state.cursor).toEqual([{ chapter: 'ch01' }])
  })

  it('toc getter/setter round-trips', () => {
    state.build = 'epub'
    state.toc = [{ title: 'Chapter 1' }]
    expect(state.toc).toEqual([{ title: 'Chapter 1' }])
  })

  it('remoteAssets getter/setter round-trips', () => {
    state.build = 'epub'
    state.remoteAssets = ['http://example.com/asset.jpg']
    expect(state.remoteAssets).toEqual(['http://example.com/asset.jpg'])
  })

  it('loi getter/setter round-trips', () => {
    state.build = 'epub'
    state.loi = [{ id: 'loi-1' }]
    expect(state.loi).toEqual([{ id: 'loi-1' }])
  })

  it('srcDir getter returns config.src', () => {
    expect(typeof state.srcDir).toBe('string')
  })

  it('srcDir setter updates config.src', () => {
    const orig = state.srcDir
    state.srcDir = '/tmp/test-src'
    expect(state.srcDir).toBe('/tmp/test-src')
    state.srcDir = orig
  })

  it('distDir getter returns builds[build].dist when build is set', () => {
    state.build = 'epub'
    expect(typeof state.distDir).toBe('string')
  })

  it('distDir setter updates config.dist', () => {
    const orig = state.config.dist
    state.distDir = '/tmp/test-dist'
    expect(state.config.dist).toBe('/tmp/test-dist')
    state.config.dist = orig
  })

  it('env getter returns process.env.NODE_ENV or development', () => {
    expect(state.env).toBe('test')
  })
})

describe('State src path helpers', () => {
  it('src.root() joins srcDir with args', () => {
    const result = state.src.root('some', 'path')
    expect(result).toContain('some')
    expect(result).toContain('path')
  })

  it('src.images() builds path into _images dir', () => {
    const result = state.src.images('cover.jpg')
    expect(result).toContain('_images')
    expect(result).toContain('cover.jpg')
  })

  it('src.markdown() builds path into _markdown dir', () => {
    expect(state.src.markdown('ch01.md')).toContain('_markdown')
  })

  it('src.stylesheets() builds path into _stylesheets dir', () => {
    expect(state.src.stylesheets('main.scss')).toContain('_stylesheets')
  })

  it('src.javascripts() builds path into _javascripts dir', () => {
    expect(state.src.javascripts('app.js')).toContain('_javascripts')
  })

  it('src.fonts() builds path into _fonts dir', () => {
    expect(state.src.fonts()).toContain('_fonts')
  })

  it('src.media() builds path into _media dir', () => {
    expect(state.src.media('video.mp4')).toContain('_media')
  })
})

describe('State dist path helpers', () => {
  it('dist.root() joins distDir with args', () => {
    state.build = 'epub'
    const result = state.dist.root('manifest.opf')
    expect(result).toContain('manifest.opf')
  })

  it('dist.ops() includes OPS segment', () => {
    state.build = 'epub'
    expect(state.dist.ops()).toContain('OPS')
  })

  it('dist.text() includes OPS/text path', () => {
    state.build = 'epub'
    expect(state.dist.text('ch01.xhtml')).toContain('text')
  })

  it('dist.images() includes OPS/images path', () => {
    state.build = 'epub'
    expect(state.dist.images('cover.jpg')).toContain('images')
  })

  it('dist.stylesheets() includes OPS/stylesheets path', () => {
    state.build = 'epub'
    expect(state.dist.stylesheets('main.css')).toContain('stylesheets')
  })

  it('dist.javascripts() includes OPS/javascripts path', () => {
    state.build = 'epub'
    expect(state.dist.javascripts('app.js')).toContain('javascripts')
  })

  it('dist.fonts() includes OPS/fonts path', () => {
    state.build = 'epub'
    expect(state.dist.fonts()).toContain('fonts')
  })

  it('dist.media() includes OPS/media path', () => {
    state.build = 'epub'
    expect(state.dist.media('video.mp4')).toContain('media')
  })
})
