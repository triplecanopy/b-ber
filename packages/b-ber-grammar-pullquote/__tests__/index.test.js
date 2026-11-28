import { h, serialize } from '../../b-ber-markdown-renderer/src/xhtml'
import pullquote from '../src'

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  // Returns an Error, as the real log.error does, so that a site's
  // `throw log.error(...)` throws one rather than undefined
  error: jest.fn((err) =>
    err instanceof Error ? err : new Error(String(err))
  ),
  warn: jest.fn(),
  debug: jest.fn(),
}))

jest.mock('@canopycanopycanopy/b-ber-grammar-attributes', () => ({
  attributesObject: jest.fn((attrs) =>
    attrs && attrs.includes('citation')
      ? { citation: 'Jane Doe', classes: 'pullquote' }
      : { classes: 'pullquote' }
  ),
  attributesList: jest.requireActual('../../b-ber-grammar-attributes/src')
    .attributesList,
  parseAttrs: jest.requireActual('../../b-ber-grammar-attributes/src')
    .parseAttrs,
}))

const instance = { renderInline: jest.fn((str) => str) }
const context = { fileName: 'test' }
// The render's env, as the renderer passes it
const env = { document: { fileName: 'test' }, result: {} }

describe('b-ber-grammar-pullquote', () => {
  it('exports plugin, name, and renderer', () => {
    expect(pullquote.plugin).toBeFunction()
    expect(pullquote.name).toBe('pullQuote')
    expect(pullquote.renderer).toBeFunction()
  })

  it('renderer returns a config object', () => {
    const config = pullquote.renderer({ instance, context })
    expect(config.marker).toBeDefined()
    expect(config.minMarkers).toBeNumber()
    expect(config.validateOpen).toBeFunction()
    expect(config.render).toBeFunction()
  })

  it('validateOpen throws what log.error reports when id is missing', () => {
    const config = pullquote.renderer({ instance, context })
    expect(() => config.validateOpen('pullquote', 1)).toThrow('Missing [id]')
  })

  it('validateOpen returns true for a valid pullquote directive', () => {
    const config = pullquote.renderer({ instance, context })
    expect(config.validateOpen('pullquote:pq-02', 1)).toBe(true)
  })

  // Built whole, from the block's node and its rendered children, where the
  // directive rule closes it (TASK-175, TASK-176). The citation used to be
  // kept in module-level state from the open to the exit
  describe('render', () => {
    const build = (name, id, info, children = [h('p', null, ['q'])]) => {
      const config = pullquote.renderer({ instance, context })
      const node = { name, id, info, line: 0 }
      return serialize(config.render({ node, env, h })(children, 'exit'))
    }

    it('builds a pullquote with the citation from the opener’s line', () => {
      expect(
        build(
          'pullquote',
          'cited-01',
          ' pullquote:cited-01 citation:"Jane Doe"'
        )
      ).toBe(
        '<!-- START: section:pullquote#cited-01 --><section class="pullquote"><p>q</p>\n        ' +
          '<footer><cite>&#8212;&#160;Jane Doe</cite></footer>\n        ' +
          '</section><!-- END: section:pullquote#cited-01 -->\n    '
      )
      expect(instance.renderInline).toHaveBeenCalledWith('Jane Doe', env)
    })

    it('builds a blockquote, without a footer when there is no citation', () => {
      const built = build(
        'blockquote',
        'plain-01',
        ' blockquote:plain-01 classes:x'
      )
      expect(built).not.toContain('<footer>')
      expect(built).toContain('<blockquote class="pullquote"><p>q</p>')
      expect(built).toContain(
        '</blockquote><!-- END: section:blockquote#plain-01 -->'
      )
    })

    // It drew neither its open nor its close (TASK-174's quirk 2)
    it('builds a pullquote whose opener has `exit` in its line', () => {
      expect(
        build('pullquote', 'pq', ' pullquote:pq citation:"exit:here"')
      ).toContain(
        '<section class="pullquote"><p>q</p>\n        <footer><cite>&#8212;&#160;exit:here</cite></footer>'
      )
    })
  })
})
