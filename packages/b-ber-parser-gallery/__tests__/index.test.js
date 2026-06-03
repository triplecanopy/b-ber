import { parseAttrs } from '@canopycanopycanopy/b-ber-grammar-attributes'
import MarkdownIt from 'markdown-it'
import galleryPlugin from '../src'

// Mock b-ber-lib — gallery reads _state[attrs.type] for media lookups
jest.mock('@canopycanopycanopy/b-ber-lib', () => ({
  State: {
    config: {},
    audio: [],
    video: [],
    figures: [],
  },
}))

// b-ber-grammar-attributes is symlinked in node_modules; mock the three helpers
// used by the gallery plugin to avoid pulling in its heavy dependency tree
jest.mock('@canopycanopycanopy/b-ber-grammar-attributes', () => ({
  htmlId: jest.fn((s) => s),
  parseAttrs: jest.fn(() => ({})),
  toAlias: jest.fn((s) => s),
}))

const mockOptions = {
  validateOpen: jest.fn(() => true),
  validateClose: jest.fn(() => false),
  render: jest.fn(() => ''),
  marker: ':',
  minMarkers: 3,
}

describe('b-ber-parser-gallery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('exports a function', () => {
    expect(typeof galleryPlugin).toBe('function')
  })

  test('registers on a markdown-it instance without throwing', () => {
    const md = new MarkdownIt()
    expect(() => galleryPlugin(md, 'gallery', mockOptions)).not.toThrow()
  })

  test('adds a block rule named container_gallery', () => {
    const md = new MarkdownIt()
    galleryPlugin(md, 'gallery', mockOptions)
    const ruleNames = md.block.ruler.__rules__.map((r) => r.name)
    expect(ruleNames).toContain('container_gallery')
  })

  test('registers open and close renderer rules', () => {
    const md = new MarkdownIt()
    galleryPlugin(md, 'gallery', mockOptions)
    expect(typeof md.renderer.rules.container_gallery_open).toBe('function')
    expect(typeof md.renderer.rules.container_gallery_close).toBe('function')
  })

  test('calls validateOpen when rendering gallery content', () => {
    const md = new MarkdownIt()
    galleryPlugin(md, 'gallery', mockOptions)
    md.render('::: gallery:my-id\nContent\n')
    expect(mockOptions.validateOpen).toHaveBeenCalled()
  })

  test('calls render when validateOpen returns true', () => {
    const render = jest.fn(() => '')
    const md = new MarkdownIt()
    galleryPlugin(md, 'gallery', { ...mockOptions, render })
    md.render('::: gallery:my-id\nContent\n')
    expect(render).toHaveBeenCalled()
  })

  test('does not call render when validateOpen returns false', () => {
    const validateOpen = jest.fn(() => false)
    const render = jest.fn(() => '')
    const md = new MarkdownIt()
    galleryPlugin(md, 'gallery', { ...mockOptions, validateOpen, render })
    md.render('::: gallery:my-id\nContent\n')
    expect(validateOpen).toHaveBeenCalled()
    expect(render).not.toHaveBeenCalled()
  })

  test('processes :: ... :: inline pattern inside gallery block', () => {
    const md = new MarkdownIt()
    galleryPlugin(md, 'gallery', mockOptions)
    expect(() =>
      md.render('::: gallery:my-id\n:: item source="img.jpg" ::\n')
    ).not.toThrow()
    expect(mockOptions.validateOpen).toHaveBeenCalled()
  })

  test('processes image type gallery item via parseAttrs', () => {
    parseAttrs.mockReturnValue({ type: 'image', source: 'img.jpg', item: '1' })
    const md = new MarkdownIt()
    galleryPlugin(md, 'gallery', mockOptions)
    expect(() =>
      md.render('::: gallery:my-id\n:: image source="img.jpg" ::\n')
    ).not.toThrow()
  })

  test('processes video type gallery item via parseAttrs', () => {
    parseAttrs.mockReturnValue({ type: 'video', source: 'clip.mp4', item: '1' })
    const md = new MarkdownIt()
    galleryPlugin(md, 'gallery', mockOptions)
    expect(() =>
      md.render('::: gallery:my-id\n:: video source="clip.mp4" ::\n')
    ).not.toThrow()
  })

  test('handles content with no :: pattern inside gallery block', () => {
    const md = new MarkdownIt()
    galleryPlugin(md, 'gallery', mockOptions)
    expect(() =>
      md.render('::: gallery:my-id\nPlain content without double-colon.\n')
    ).not.toThrow()
    expect(mockOptions.render).toHaveBeenCalled()
  })

  test('does not process child tokens outside gallery block', () => {
    const md = new MarkdownIt()
    // Register as 'section', not 'gallery' — forEach loop checks for container_gallery_open
    galleryPlugin(md, 'section', mockOptions)
    expect(() =>
      md.render('::: section:my-id\n:: item source="img.jpg" ::\n')
    ).not.toThrow()
  })
})
