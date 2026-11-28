import state from '@canopycanopycanopy/b-ber-lib/State'
import log from '@canopycanopycanopy/b-ber-logger'
import MarkdownIt from 'markdown-it'
import section from '../src'

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  build: 'epub',
  // The real target of `build`, as State gives it
  get target() {
    return jest
      .requireActual('../../b-ber-lib/src/Target')
      .getTarget(this.build)
  },
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

const context = { fileName: 'test' }

describe('b-ber-grammar-section', () => {
  it('exports plugin, name, and renderer', () => {
    expect(section.plugin).toBeFunction()
    expect(section.name).toBe('section')
    expect(section.renderer).toBeFunction()
  })

  it('renderer returns a config object', () => {
    const config = section.renderer({ context })
    expect(config.marker).toBeDefined()
    expect(config.minMarkers).toBeNumber()
    expect(config.render).toBeFunction()
  })

  it('render openElement produces section with id', () => {
    const config = section.renderer({ context })
    const tokens = [{ nesting: 1, info: 'chapter:ch-01', map: [0, 1] }]
    const result = config.render(tokens, 0)
    expect(result).toContain('<section')
    expect(result).toContain('ch-01')
  })

  it('render closeElement returns empty string when id is not in state', () => {
    // state is imported at top level
    state.contains.mockReturnValue(false)
    const config = section.renderer({ context })
    const tokens = [{ nesting: -1, info: 'chapter:ch-99', map: [5, 6] }]
    const result = config.render(tokens, 0)
    expect(result).toBe('')
  })

  it('render handleExitDirective returns closing section tag', () => {
    // state is imported at top level
    state.contains.mockReturnValue(true)
    const config = section.renderer({ context })
    const tokens = [{ nesting: 1, info: 'exit:ch-01', map: [5, 6] }]
    const result = config.render(tokens, 0)
    expect(result).toContain('</section>')
    expect(result).toContain('ch-01')
  })
})

// Rendered through markdown-it, with the mocked State keeping a real cursor
describe('b-ber-grammar-section, rendered', () => {
  let cursor

  beforeEach(() => {
    cursor = []
    state.indexOf.mockImplementation((_coll, { id }) =>
      cursor.findIndex((entry) => entry.id === id)
    )
    state.add.mockImplementation((_prop, entry) => cursor.push(entry))
    log.error.mockImplementation((message) => new Error(message))
  })

  afterEach(() => {
    state.indexOf.mockReset().mockReturnValue(-1)
    state.add.mockReset()
    log.error.mockReset()
  })

  const render = (src) =>
    new MarkdownIt()
      .use(section.plugin, 'section', section.renderer({ context }))
      .render(src)

  it('renders a section opened after a blank line', () => {
    const html = render('para\n\n::: section:b\n\nbody\n\n::: exit:b\n')
    expect(html).toContain('<section id="b"')
    expect(html).toContain('<p>body</p>')
  })

  // TASK-153 pinned a defect here: a directive straight after a paragraph
  // line threw a false `Duplicate [id]`, because `validateOpen` records the
  // id during markdown-it's silent-mode lookahead. The build no longer parses
  // these blocks with `plugin`: b-ber-markdown-renderer's directive rule does
  // (TASK-174), and its test "renders a section straight after a paragraph
  // line" asserts the fix. `plugin` and `validateOpen` still have the defect,
  // as dialogue, gallery and spread do until TASK-175.
})
