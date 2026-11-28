import figureTemplate from '@canopycanopycanopy/b-ber-templates/figures'
import mimeTypes from 'mime-types'
import { getTarget } from '../../b-ber-lib/src/Target'
import { createFigure, createFigureInline } from '../src/image'

jest.mock('@canopycanopycanopy/b-ber-lib', () => ({
  ...jest.requireActual('../../b-ber-lib/src/markdown'),
  Html: {
    comment: jest.fn((s) => s),
    escape: jest.requireActual('../../b-ber-lib/src/Html').default.escape,
  },
  utils: {
    getImageOrientation: jest.fn(() => 'landscape'),
  },
}))

jest.mock('@canopycanopycanopy/b-ber-templates/figures', () =>
  jest.fn(() => '<figure class="inline">inline figure</figure>')
)

jest.mock('mime-types', () => ({
  lookup: jest.fn(() => 'image/jpeg'),
}))

// The render's env: the document, for `target`, as the renderer passes it
const envFor = (target = 'epub', figuresBefore = 0) => ({
  document: {
    fileName: 'chapter-01',
    target: getTarget(target),
    figuresBefore,
  },
  result: { figures: [] },
})

let env
const baseArgs = {
  width: 100,
  height: 150,
  comment: '<!-- comment -->',
  id: 'fig1',
  attrsObject: { source: 'image one.jpg', alt: 'an image' },
  caption: 'a caption',
  mediaType: 'figure',
}

describe('b-ber-grammar-image / image', () => {
  beforeEach(() => {
    env = envFor()
  })

  const args = () => ({ ...baseArgs, env })

  describe('createFigure', () => {
    it('collects a figure entry into the document’s figures', () => {
      createFigure(args())

      expect(env.result.figures).toEqual([
        expect.objectContaining({
          id: 'fig1',
          width: 100,
          height: 150,
          page: 'figurefig1.xhtml',
          ref: 'chapter-01',
          caption: 'a caption',
          mediaType: 'figure',
          pageOrder: 0,
          mime: 'image/jpeg',
        }),
      ])
    })

    // A figure's place in the list of illustrations is book-wide
    it('orders a figure after the book’s figures so far', () => {
      env = envFor('epub', 2)
      env.result.figures.push({ id: 'existing' })

      createFigure(args())

      expect(env.result.figures[1]).toEqual(
        expect.objectContaining({ pageOrder: 3 })
      )
    })

    it('appends the orientation class when no classes are provided', () => {
      const result = createFigure(args())

      expect(result).toContain('figure__small figure__small--landscape')
    })

    it('appends the orientation class to existing classes', () => {
      const result = createFigure({
        ...args(),
        attrsObject: { ...baseArgs.attrsObject, classes: 'custom-class' },
      })

      expect(result).toContain(
        'custom-class figure__small figure__small--landscape'
      )
    })

    it('links to the figure page for non-reader builds', () => {
      const result = createFigure(args())

      expect(result).toContain('href="figurefig1.xhtml#fig1"')
    })

    it('links to the titlepage for reader builds', () => {
      env = envFor('reader')

      const result = createFigure(args())

      expect(result).toContain('href="figures-titlepage.xhtml#fig1"')
    })

    it('encodes the image source in the img src attribute', () => {
      const result = createFigure(args())

      expect(result).toContain(
        `src="../images/${encodeURIComponent('image one.jpg')}"`
      )
    })

    it('includes the alt text and the comment', () => {
      const result = createFigure(args())

      expect(result).toContain('alt="an image"')
      expect(result).toContain('<!-- comment -->')
    })

    it('escapes the alt text and the classes (TASK-161)', () => {
      const result = createFigure({
        ...args(),
        attrsObject: {
          ...baseArgs.attrsObject,
          alt: 'Tom & "Jerry" <3',
          classes: 'a"b',
        },
      })

      expect(result).toContain('alt="Tom &amp; &quot;Jerry&quot; &lt;3"')
      expect(result).toContain('class="a&quot;b')
    })
  })

  describe('createFigureInline', () => {
    it('renders via the figures template with classes defaulted to empty string', () => {
      const result = createFigureInline({
        env,
        attrsObject: { source: 'image.jpg', alt: 'an image' },
        id: 'fig1',
        width: 100,
        height: 150,
        caption: 'a caption',
      })

      expect(figureTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'image.jpg',
          alt: 'an image',
          classes: '',
          id: 'fig1',
          width: 100,
          height: 150,
          caption: 'a caption',
          inline: true,
          mime: 'image/jpeg',
        }),
        env.document.target
      )
      expect(result).toBe('<figure class="inline">inline figure</figure>')
    })

    it('preserves provided classes', () => {
      createFigureInline({
        env,
        attrsObject: {
          source: 'image.jpg',
          alt: 'an image',
          classes: 'custom-class',
        },
        id: 'fig1',
        width: 100,
        height: 150,
        caption: '',
      })

      expect(figureTemplate).toHaveBeenCalledWith(
        expect.objectContaining({ classes: 'custom-class' }),
        env.document.target
      )
    })

    it('looks up the mime type from the image source', () => {
      createFigureInline({
        env,
        attrsObject: { source: 'image.png', alt: '' },
        id: 'fig2',
        width: 10,
        height: 10,
        caption: '',
      })

      expect(mimeTypes.lookup).toHaveBeenCalledWith('image.png')
    })
  })
})
