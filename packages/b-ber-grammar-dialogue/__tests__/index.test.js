import { h, serialize } from '../../b-ber-markdown-renderer/src/xhtml'
import dialogue from '../src'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  add: jest.fn(),
  remove: jest.fn(),
  indexOf: jest.fn(() => -1),
  contains: jest.fn(() => false),
}))

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

describe('b-ber-grammar-dialogue', () => {
  it('exports plugin, name, and renderer', () => {
    expect(dialogue.plugin).toBeFunction()
    expect(dialogue.name).toBe('dialogue')
    expect(dialogue.renderer).toBeFunction()
  })

  it('renderer returns a config object', () => {
    const config = dialogue.renderer({ context: { fileName: 'test' } })
    expect(config.marker).toBeDefined()
    expect(config.minMarkers).toBeNumber()
    expect(config.render).toBeFunction()
  })

  // Built whole, from the node and its children (TASK-176)
  it('builds a dialogue section with its children', () => {
    const config = dialogue.renderer({ context: { fileName: 'test' } })
    const node = {
      name: 'dialogue',
      id: 'ch-01',
      info: 'dialogue:ch-01',
      line: 0,
    }
    const build = config.render({ node, env: {}, h })
    expect(serialize(build([h('p', null, ['Hi'])], 'exit'))).toBe(
      '<section id="ch-01" class=" dialogue"><p>Hi</p></section>\n<!-- END: section:exit#ch-01 -->\n'
    )
    expect(serialize(build([], 'end'))).toBe(
      '<section id="ch-01" class=" dialogue"></section>\n<!-- END: section:#ch-01 -->\n'
    )
  })
})
