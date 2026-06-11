import figureTemplate from '@canopycanopycanopy/b-ber-templates/figures'
import mimeTypes from 'mime-types'
import { createFigure, createFigureInline } from '../src/image'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  build: 'epub',
  figures: [],
  add: jest.fn(),
  src: {
    images: (p) => p,
  },
}))

jest.mock('@canopycanopycanopy/b-ber-lib', () => ({
  State: jest.requireMock('@canopycanopycanopy/b-ber-lib/State'),
  Html: { comment: jest.fn((s) => s) },
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

const { State: state } = jest.requireMock('@canopycanopycanopy/b-ber-lib')

const baseArgs = {
  context: { fileName: 'chapter-01' },
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
    state.build = 'epub'
    state.figures = []
    state.add.mockClear()
  })

  describe('createFigure', () => {
    it('registers a figure entry in state.figures via state.add', () => {
      createFigure(baseArgs)

      expect(state.add).toHaveBeenCalledWith(
        'figures',
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
        })
      )
    })

    it('uses pageOrder based on the current number of registered figures', () => {
      state.figures = [{ id: 'existing' }]

      createFigure(baseArgs)

      expect(state.add).toHaveBeenCalledWith(
        'figures',
        expect.objectContaining({ pageOrder: 1 })
      )
    })

    it('appends the orientation class when no classes are provided', () => {
      const result = createFigure(baseArgs)

      expect(result).toContain('figure__small figure__small--landscape')
    })

    it('appends the orientation class to existing classes', () => {
      const result = createFigure({
        ...baseArgs,
        attrsObject: { ...baseArgs.attrsObject, classes: 'custom-class' },
      })

      expect(result).toContain(
        'custom-class figure__small figure__small--landscape'
      )
    })

    it('links to the figure page for non-reader builds', () => {
      state.build = 'epub'

      const result = createFigure(baseArgs)

      expect(result).toContain('href="figurefig1.xhtml#fig1"')
    })

    it('links to the titlepage for reader builds', () => {
      state.build = 'reader'

      const result = createFigure(baseArgs)

      expect(result).toContain('href="figures-titlepage.xhtml#fig1"')
    })

    it('encodes the image source in the img src attribute', () => {
      const result = createFigure(baseArgs)

      expect(result).toContain(
        `src="../images/${encodeURIComponent('image one.jpg')}"`
      )
    })

    it('includes the alt text and the comment', () => {
      const result = createFigure(baseArgs)

      expect(result).toContain('alt="an image"')
      expect(result).toContain('<!-- comment -->')
    })
  })

  describe('createFigureInline', () => {
    it('renders via the figures template with classes defaulted to empty string', () => {
      const result = createFigureInline({
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
        state.build
      )
      expect(result).toBe('<figure class="inline">inline figure</figure>')
    })

    it('preserves provided classes', () => {
      createFigureInline({
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
        state.build
      )
    })

    it('looks up the mime type from the image source', () => {
      createFigureInline({
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
