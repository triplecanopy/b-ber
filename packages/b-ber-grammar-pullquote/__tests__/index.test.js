import log from '@canopycanopycanopy/b-ber-logger'
import pullquote from '../src'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  cursor: [],
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
}))

const { indexOf } = jest.requireMock('@canopycanopycanopy/b-ber-lib/State')

const instance = { renderInline: jest.fn((str) => str) }
const context = { fileName: 'test' }

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

  it('validateOpen returns false when id is missing', () => {
    const config = pullquote.renderer({ instance, context })
    expect(config.validateOpen('pullquote', 1)).toBe(false)
  })

  it('render returns empty string for closing token (nesting -1)', () => {
    const config = pullquote.renderer({ instance, context })
    const tokens = [{ nesting: -1, info: 'exit:pq-01', map: [10, 11] }]
    expect(config.render(tokens, 0)).toBe('')
  })

  it('render handleOpen produces section open tag for pullquote directive', () => {
    const config = pullquote.renderer({ instance, context })
    const tokens = [{ nesting: 1, info: 'pullquote:pq-01', map: [0, 1] }]
    const result = config.render(tokens, 0)
    expect(result).toContain('<section')
    expect(result).toContain('pq-01')
  })

  it('render handleOpen produces blockquote open tag for blockquote directive', () => {
    const config = pullquote.renderer({ instance, context })
    const tokens = [{ nesting: 1, info: 'blockquote:bq-01', map: [0, 1] }]
    const result = config.render(tokens, 0)
    expect(result).toContain('<blockquote')
    expect(result).toContain('bq-01')
  })

  it('validateOpen returns true for a valid pullquote directive', () => {
    const config = pullquote.renderer({ instance, context })
    expect(config.validateOpen('pullquote:pq-02', 1)).toBe(true)
  })

  it('handleOpen logs an error when the [id] is a duplicate', () => {
    indexOf.mockReturnValueOnce(0)
    const config = pullquote.renderer({ instance, context })

    config.render([{ nesting: 1, info: 'pullquote:dup-id', map: [0, 1] }], 0)

    expect(log.error).toHaveBeenCalledWith(
      expect.stringContaining('Duplicate [id] [dup-id]')
    )

    // close it again so the module-level index stack stays balanced
    config.render([{ nesting: 1, info: 'exit:dup-id', map: [2, 3] }], 0)
  })

  it('emits a citation footer on exit and resets the citation afterwards', () => {
    const config = pullquote.renderer({ instance, context })

    config.render(
      [
        {
          nesting: 1,
          info: 'pullquote:cited-01 citation:"Jane Doe"',
          map: [0, 1],
        },
      ],
      0
    )

    const closed = config.render(
      [{ nesting: 1, info: 'exit:cited-01', map: [2, 3] }],
      0
    )

    expect(closed).toContain('<footer><cite>')
    expect(closed).toContain('Jane Doe')
    expect(closed).toContain('</section>')
    expect(closed).toContain('END: section:pullquote#cited-01')
    expect(instance.renderInline).toHaveBeenCalledWith('Jane Doe')

    // the citation was reset, so a subsequent exit has no footer
    config.render([{ nesting: 1, info: 'pullquote:plain-01', map: [4, 5] }], 0)
    const closedPlain = config.render(
      [{ nesting: 1, info: 'exit:plain-01', map: [6, 7] }],
      0
    )
    expect(closedPlain).not.toContain('<footer>')
  })

  it('handleClose returns an empty string when the exit id does not match the open id', () => {
    const config = pullquote.renderer({ instance, context })

    config.render(
      [{ nesting: 1, info: 'pullquote:mismatch-01', map: [0, 1] }],
      0
    )

    const result = config.render(
      [{ nesting: 1, info: 'exit:other-id', map: [2, 3] }],
      0
    )
    expect(result).toBe('')

    // close it for real so the module-level index stack stays balanced
    config.render([{ nesting: 1, info: 'exit:mismatch-01', map: [4, 5] }], 0)
  })
})
