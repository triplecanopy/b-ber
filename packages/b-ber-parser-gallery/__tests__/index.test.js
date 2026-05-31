import MarkdownIt from 'markdown-it'

import galleryPlugin from '../src'

// Mock b-ber-lib/State — gallery reads _state[attrs.type] for media lookups
jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  config: {},
  audio: [],
  video: [],
  figures: [],
}))

// b-ber-grammar-attributes is symlinked in node_modules; mock the three helpers
// used by the gallery plugin to avoid pulling in its heavy dependency tree
jest.mock('@canopycanopycanopy/b-ber-grammar-attributes', () => ({
  htmlId: jest.fn(s => s),
  parseAttrs: jest.fn(() => ({})),
  toAlias: jest.fn(s => s),
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
    const ruleNames = md.block.ruler.__rules__.map(r => r.name)
    expect(ruleNames).toContain('container_gallery')
  })

  test('registers open and close renderer rules', () => {
    const md = new MarkdownIt()
    galleryPlugin(md, 'gallery', mockOptions)
    expect(typeof md.renderer.rules.container_gallery_open).toBe('function')
    expect(typeof md.renderer.rules.container_gallery_close).toBe('function')
  })
})
