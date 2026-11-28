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
  attributesString: jest.fn((obj) =>
    Object.entries(obj)
      .map(([key, value]) => ` ${key}="${value}"`)
      .join('')
  ),
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

  it('render returns empty string for closing token (nesting -1)', () => {
    const config = pullquote.renderer({ instance, context })
    const tokens = [{ nesting: -1, info: 'exit:pq-01', map: [10, 11] }]
    expect(config.render(tokens, 0, {}, env)).toBe('')
  })

  it('render handleOpen produces section open tag for pullquote directive', () => {
    const config = pullquote.renderer({ instance, context })
    const tokens = [{ nesting: 1, info: 'pullquote:pq-01', map: [0, 1] }]
    const result = config.render(tokens, 0, {}, env)
    expect(result).toContain('<section')
    expect(result).toContain('pq-01')
  })

  it('render handleOpen produces blockquote open tag for blockquote directive', () => {
    const config = pullquote.renderer({ instance, context })
    const tokens = [{ nesting: 1, info: 'blockquote:bq-01', map: [0, 1] }]
    const result = config.render(tokens, 0, {}, env)
    expect(result).toContain('<blockquote')
    expect(result).toContain('bq-01')
  })

  it('validateOpen returns true for a valid pullquote directive', () => {
    const config = pullquote.renderer({ instance, context })
    expect(config.validateOpen('pullquote:pq-02', 1)).toBe(true)
  })

  // The directive rule draws every close, from the block's node, and checks
  // its id against the file's other blocks (TASK-175). The citation used to
  // be kept in module-level state from the open to the exit
  describe('close', () => {
    it('draws the citation from the opener’s line', () => {
      const config = pullquote.renderer({ instance, context })
      const closed = config.close(
        {
          name: 'pullquote',
          id: 'cited-01',
          info: ' pullquote:cited-01 citation:"Jane Doe"',
        },
        'exit',
        env
      )

      expect(closed).toContain(
        '<footer><cite>&#8212;&#160;Jane Doe</cite></footer>'
      )
      expect(closed).toContain(
        '</section><!-- END: section:pullquote#cited-01 -->'
      )
      expect(instance.renderInline).toHaveBeenCalledWith('Jane Doe', env)
    })

    it('closes a blockquote, without a footer when there is no citation', () => {
      const config = pullquote.renderer({ instance, context })
      const closed = config.close(
        {
          name: 'blockquote',
          id: 'plain-01',
          info: ' blockquote:plain-01 classes:x',
        },
        'exit',
        env
      )

      expect(closed).not.toContain('<footer>')
      expect(closed).toContain(
        '</blockquote><!-- END: section:blockquote#plain-01 -->'
      )
    })

    it('draws nothing for an opener with `exit` in its line, which drew no open', () => {
      const config = pullquote.renderer({ instance, context })
      const info = ' pullquote:pq citation:"exit:here"'
      expect(
        config.render([{ nesting: 1, info, map: [0, 1] }], 0, {}, env)
      ).toBe('')
      expect(
        config.close({ name: 'pullquote', id: 'pq', info }, 'exit', env)
      ).toBe('')
    })
  })
})
