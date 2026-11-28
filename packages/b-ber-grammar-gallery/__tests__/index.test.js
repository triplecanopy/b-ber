import { getTarget } from '../../b-ber-lib/src/Target'
import { h, serialize } from '../../b-ber-markdown-renderer/src/xhtml'
import gallery from '../src'

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

const context = { fileName: 'test' }

// The render's env: the document, for `target`, as the renderer passes it
const envFor = (target = 'epub') => ({
  document: { fileName: 'test', target: getTarget(target) },
  result: {},
})

describe('b-ber-grammar-gallery', () => {
  it('exports plugin, name, and renderer', () => {
    expect(gallery.plugin).toBeFunction()
    expect(gallery.name).toBe('gallery')
    expect(gallery.renderer).toBeFunction()
  })

  it('renderer returns a config object', () => {
    const config = gallery.renderer({ context })
    expect(config.marker).toBeDefined()
    expect(config.minMarkers).toBeNumber()
    expect(config.render).toBeFunction()
  })

  // Built whole, from the node and its children (TASK-176). Its closing
  // markup used to be b-ber-grammar-section's
  const build = (target, closedBy = 'exit') => {
    const config = gallery.renderer({ context })
    const node = { name: 'gallery', id: 'g-01', info: 'gallery:g-01', line: 0 }
    return serialize(
      config.render({ node, env: envFor(target), h })(
        [h('p', null, ['i'])],
        closedBy
      )
    )
  }

  it('builds a section where the target has no full-bleed containers', () => {
    expect(build('epub')).toBe(
      '<section id="g-01" class=" gallery"><p>i</p></section>\n<!-- END: section:exit#g-01 -->\n'
    )
  })

  it('builds the full-bleed figure where the target has them', () => {
    const built = build('web', 'end')
    expect(built).toMatch(
      /^\s+<section id="g-01" class=" gallery">\s+<div class="figure__large figure__inline figure__fullbleed figure__gallery">\s+<figure>\s+<div class="figure__items"><p>i<\/p><\/div>\s+<\/figure>\s+<\/div>\s+<\/section>/
    )
    expect(built).toMatch(/<!-- END: section:#g-01 -->\n$/)
  })
})
