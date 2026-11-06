import fs from 'fs-extra'
import os from 'os'
import path from 'path'

jest.mock('../src/Spine')
jest.mock('../src/SpineItem')

let opsPath
let fileId
let getImageDimensions
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
    getImageDimensions,
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

describe('getImageDimensions', () => {
  const fixtures = path.join(__dirname, 'fixtures', 'images')

  // Real files, not a mocked image-size: the point is to catch a dependency
  // update that changes what the library returns.
  it.each([
    ['image.jpg', 3, 2],
    ['image.png', 3, 2],
    ['image.gif', 3, 2],
    ['image.webp', 3, 2],
    ['image.svg', 3, 2],
    ['viewbox.svg', 30, 20],
  ])('reads the dimensions of %s', (file, width, height) => {
    expect(getImageDimensions(path.join(fixtures, file))).toEqual({
      width,
      height,
    })
  })

  describe('with a JPEG whose frame header is past the first 512KB', () => {
    let tmpDir
    let bigHeaderJpeg

    beforeAll(async () => {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'b-ber-lib-image-'))
      bigHeaderJpeg = path.join(tmpDir, 'big-header.jpg')

      // Insert comment (COM, 0xFFFE) segments between the SOI marker and the
      // rest of the image. Large EXIF/XMP/ICC blocks do the same thing in real
      // photographs. A segment length is 16 bits, so it takes several to pass
      // the 512KB that image-size reads when it is handed a path.
      const jpeg = await fs.readFile(path.join(fixtures, 'image.jpg'))
      const segmentLength = 0xffff
      const segment = Buffer.alloc(segmentLength + 2, 0x20)
      segment.writeUInt16BE(0xfffe, 0)
      segment.writeUInt16BE(segmentLength, 2)
      const segments = Array.from({ length: 9 }, () => segment)

      await fs.writeFile(
        bigHeaderJpeg,
        Buffer.concat([jpeg.subarray(0, 2), ...segments, jpeg.subarray(2)])
      )
    })

    afterAll(() => fs.remove(tmpDir))

    it('still reads the dimensions', () => {
      expect(fs.statSync(bigHeaderJpeg).size).toBeGreaterThan(512 * 1024)
      expect(getImageDimensions(bigHeaderJpeg)).toEqual({ width: 3, height: 2 })
    })
  })

  it('names the file when it is not an image', () => {
    const file = path.join(__dirname, 'utils.test.js')
    expect(() => getImageDimensions(file)).toThrow(
      `Could not read image dimensions [${file}]`
    )
  })

  it('names the file when it does not exist', () => {
    const file = path.join(fixtures, 'missing.png')
    expect(() => getImageDimensions(file)).toThrow(
      `Could not read image dimensions [${file}]`
    )
  })
})
