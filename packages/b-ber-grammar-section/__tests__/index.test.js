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

  it('render draws nothing for a closing token', () => {
    const config = section.renderer({ context })
    const tokens = [{ nesting: -1, info: 'chapter:ch-01', map: [5, 6] }]
    expect(config.render(tokens, 0)).toBe('')
  })
})

// Closes are drawn from b-ber-markdown-renderer's directive rule's node. They
// used to read the block's name, and whether it was still open, from
// `state.cursor` (TASK-175)
describe('b-ber-grammar-section close', () => {
  const { close } = section.renderer({ context })

  afterEach(() => {
    state.build = 'epub'
  })

  it('closes a block at its exit, or at the exit that crossed it', () => {
    const block = { name: 'chapter', id: 'ch.01', info: ' chapter:ch.01' }
    for (const closedBy of ['exit', 'crossed-exit']) {
      expect(close(block, closedBy)).toBe(
        '</section>\n<!-- END: section:exit#ch-01 -->\n'
      )
    }
  })

  it('closes a gallery’s full-bleed container where the target has one', () => {
    const block = { name: 'gallery', id: 'g', info: ' gallery:g' }
    expect(close(block, 'exit')).toMatch(/^<\/section>/)
    state.build = 'web'
    expect(close(block, 'exit')).toMatch(
      /^<\/div>\s+<\/figure>\s+<\/div>\s+<\/section>/
    )
  })

  // Only a structural block with no attributes used to close: the id was read
  // by splitting the opener's line on `:`, and a dialogue, gallery or spread
  // was never closed (TASK-161)
  it('closes every block left open at the end of its container', () => {
    expect(close({ name: 'chapter', id: 'c', info: ' chapter:c' }, 'end')).toBe(
      '</section>\n<!-- END: section:#c -->\n'
    )
    expect(
      close({ name: 'chapter', id: 'c', info: ' chapter:c classes:x' }, 'end')
    ).toBe('</section>\n<!-- END: section:#c -->\n')
    expect(
      close({ name: 'dialogue', id: 'd', info: ' dialogue:d' }, 'end')
    ).toBe('</section>\n<!-- END: section:#d -->\n')
    state.build = 'web'
    expect(
      close({ name: 'gallery', id: 'g', info: ' gallery:g' }, 'end')
    ).toMatch(/^<\/div>\s+<\/figure>\s+<\/div>\s+<\/section>/)
  })
})

// Rendered through markdown-it with the old parser, which the build no
// longer uses (TASK-174)
describe('b-ber-grammar-section, rendered', () => {
  beforeEach(() => {
    log.error.mockImplementation((message) => new Error(message))
  })

  afterEach(() => {
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
  // line threw a false `Duplicate [id]`, because `validateOpen` recorded the
  // id during markdown-it's silent-mode lookahead. The build parses these
  // blocks with b-ber-markdown-renderer's directive rule (TASK-174), whose
  // tests assert the fix, and `validateOpen` records nothing since TASK-175
})
