import fs from 'fs-extra'

jest.mock('../src/Spine')
jest.mock('../src/SpineItem')

let opsPath
let fileId
let getImageOrientation
let resolveIntersectingUrl
let renderPosterImage
let renderCaption
let getMediaType
let createUnsupportedInline

beforeAll(async () => {
  await fs.mkdirp('_project/_media')
  // Defer import so the State singleton initialises after the directory exists
  ;({
    opsPath,
    fileId,
    getImageOrientation,
    resolveIntersectingUrl,
    renderPosterImage,
    renderCaption,
    getMediaType,
    createUnsupportedInline,
    // eslint-disable-next-line global-require
  } = require('../src/utils'))
})

afterAll(() => Promise.all([fs.remove('_project'), fs.remove('themes')]))

describe('opsPath', () => {
  it('strips the base/OPS prefix from a path', () => {
    expect(opsPath('/builds/epub/OPS/text/ch01.xhtml', '/builds/epub')).toBe(
      'text/ch01.xhtml'
    )
  })

  it('leaves paths that do not match the prefix unchanged', () => {
    const p = '/other/path/file.xhtml'
    expect(opsPath(p, '/builds/epub')).toBe(p)
  })
})

describe('fileId', () => {
  it('prepends an underscore and replaces non-ID characters', () => {
    expect(fileId('chapter 01.xhtml')).toBe('_chapter_01_xhtml')
  })

  it('replaces slashes and dots', () => {
    expect(fileId('OPS/text/ch01.xhtml')).toBe('_OPS_text_ch01_xhtml')
  })

  it('leaves alphanumeric, hyphens, and underscores intact', () => {
    expect(fileId('chapter-01_a')).toBe('_chapter-01_a')
  })
})

describe('getImageOrientation', () => {
  it('classifies portrait-high when width:height < 0.61', () => {
    expect(getImageOrientation(100, 200)).toBe('portrait-high')
  })

  it('classifies portrait when 0.61 ≤ width:height < 1', () => {
    expect(getImageOrientation(80, 100)).toBe('portrait')
  })

  it('classifies square when width equals height', () => {
    expect(getImageOrientation(100, 100)).toBe('square')
  })

  it('classifies landscape when width > height', () => {
    expect(getImageOrientation(200, 100)).toBe('landscape')
  })
})

describe('resolveIntersectingUrl', () => {
  it('resolves a path relative to the base URL at the intersection segment', () => {
    const result = resolveIntersectingUrl(
      'http://localhost:4000/project-web',
      'project-web/OPS/text/ch01.xhtml'
    )
    expect(result).toContain('/project-web/OPS/text/ch01.xhtml')
  })

  it('returns the original string for an invalid URL', () => {
    expect(resolveIntersectingUrl('not-a-url', 'some/path')).toBe('not-a-url')
  })

  it('pops a filename segment from the URL path before finding intersection', () => {
    const result = resolveIntersectingUrl(
      'http://example.com/dir/index.html',
      'dir/subdir/page.xhtml'
    )
    expect(result).toContain('/dir/subdir/page.xhtml')
  })
})

describe('renderPosterImage', () => {
  it('returns an img tag when a poster is provided', () => {
    const result = renderPosterImage('poster.jpg')
    expect(result).toContain('<img')
    expect(result).toContain('poster.jpg')
  })

  it('returns an empty string when no poster', () => {
    expect(renderPosterImage('')).toBe('')
    expect(renderPosterImage(null)).toBe('')
    expect(renderPosterImage(undefined)).toBe('')
  })
})

describe('renderCaption', () => {
  it('returns a caption paragraph when caption text is provided', () => {
    const result = renderCaption('My caption', 'video')
    expect(result).toContain('My caption')
    expect(result).toContain('caption__video')
  })

  it('returns an empty string when no caption', () => {
    expect(renderCaption('', 'video')).toBe('')
    expect(renderCaption(null, 'video')).toBe('')
  })
})

describe('getMediaType', () => {
  it('returns the part before the first hyphen', () => {
    expect(getMediaType('audio-mp3')).toBe('audio')
    expect(getMediaType('video-mp4')).toBe('video')
  })

  it('returns the full string when there is no hyphen', () => {
    expect(getMediaType('audio')).toBe('audio')
  })
})

describe('createUnsupportedInline', () => {
  it('returns an HTML string containing the id and media type', () => {
    const result = createUnsupportedInline({
      id: 'media-01',
      commentStart: '<!-- start -->',
      commentEnd: '<!-- end -->',
      attrString: 'data-type="video"',
      mediaType: 'video',
      poster: '',
    })
    expect(result).toContain('media-01')
    expect(result).toContain('media__fallback__video')
    expect(result).toContain('<!-- start -->')
    expect(result).toContain('<!-- end -->')
  })
})
