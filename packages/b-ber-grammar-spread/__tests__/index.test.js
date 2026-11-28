import { getTarget } from '../../b-ber-lib/src/Target'
import { h, serialize } from '../../b-ber-markdown-renderer/src/xhtml'
import spread from '../src'

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

describe('b-ber-grammar-spread', () => {
  it('exports plugin, name, and renderer', () => {
    expect(spread.plugin).toBeFunction()
    expect(spread.name).toBe('spread')
    expect(spread.renderer).toBeFunction()
  })

  it('renderer returns a config object', () => {
    const config = spread.renderer({ context })
    expect(config.marker).toBeDefined()
    expect(config.minMarkers).toBeNumber()
    expect(config.render).toBeFunction()
  })

  // Built whole, from the node and its children (TASK-176). Its closing
  // markup used to be b-ber-grammar-section's
  const build = (target) => {
    const config = spread.renderer()
    const node = { name: 'spread', id: 's-01', info: 'spread:s-01', line: 0 }
    return serialize(
      config.render({ node, env: envFor(target), h })(
        [h('p', null, ['i'])],
        'exit'
      )
    )
  }

  it('builds a section where the target has no full-bleed containers', () => {
    expect(build('epub')).toBe(
      '<section id="s-01" class=" spread"><p>i</p></section>\n<!-- END: section:exit#s-01 -->\n'
    )
  })

  it('builds the full-bleed scaffold, with the reader’s marker node', () => {
    const web = build('web')
    expect(web).toMatch(
      /^\s+<div class=" spread">\s+<div id="s-01" class="spread__content"><p>i<\/p><\/div>\s+<\/div>\s+\n<!-- END: section:exit#s-01 -->\n$/
    )
    expect(build('reader')).toContain(
      '<!-- Empty node required for spread markers -->\n                   <div></div>'
    )
  })
})
