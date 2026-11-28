import log from '@canopycanopycanopy/b-ber-logger'
import { getTarget } from '../../b-ber-lib/src/Target'
import { h, serialize } from '../../b-ber-markdown-renderer/src/xhtml'
import section from '../src'

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
const env = envFor()

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

  // A block is built whole, from its node and its rendered children
  // (TASK-176)
  it('builds a section with its children and its comments', () => {
    const { render } = section.renderer({ context })
    const node = {
      name: 'chapter',
      id: 'ch.01',
      info: ' chapter:ch.01 classes:x',
      line: 3,
    }
    const build = render({ node, env, h })
    expect(serialize(build([h('p', null, ['body'])], 'exit'))).toBe(
      '\n<!-- START: section:chapter#ch-01; _markdown/test.md:3 -->\n' +
        '<section id="ch-01" class="x bodymatter chapter" epub:type="bodymatter chapter"><p>body</p></section>' +
        '\n<!-- END: section:exit#ch-01 -->\n'
    )
    expect(serialize(build([], 'end'))).toMatch(
      /<\/section>\n<!-- END: section:#ch-01 -->\n$/
    )
  })

  // It reads the opener before anything inside the block renders, so its
  // warnings come first
  it('reads the opener when it is called, and builds later', () => {
    log.warn.mockClear()
    const { render } = section.renderer({ context })
    const node = { name: 'subchapter', id: 's', info: ' subchapter:s', line: 0 }
    render({ node, env, h })
    expect(log.warn).toHaveBeenCalledTimes(1)
  })
})

// Closes are drawn from b-ber-markdown-renderer's directive rule's node. They
// used to read the block's name, and whether it was still open, from
// `state.cursor` (TASK-175)
describe('b-ber-grammar-section close', () => {
  const { close } = section.renderer({ context })

  it('closes a block at its exit, or at the exit that crossed it', () => {
    const block = { name: 'chapter', id: 'ch.01', info: ' chapter:ch.01' }
    for (const closedBy of ['exit', 'crossed-exit']) {
      expect(close(block, closedBy, env)).toBe(
        '</section>\n<!-- END: section:exit#ch-01 -->\n'
      )
    }
  })

  it('closes a gallery’s full-bleed container where the target has one', () => {
    const block = { name: 'gallery', id: 'g', info: ' gallery:g' }
    expect(close(block, 'exit', env)).toMatch(/^<\/section>/)
    expect(close(block, 'exit', envFor('web'))).toMatch(
      /^<\/div>\s+<\/figure>\s+<\/div>\s+<\/section>/
    )
  })

  // Only a structural block with no attributes used to close: the id was read
  // by splitting the opener's line on `:`, and a dialogue, gallery or spread
  // was never closed (TASK-161)
  it('closes every block left open at the end of its container', () => {
    expect(
      close({ name: 'chapter', id: 'c', info: ' chapter:c' }, 'end', env)
    ).toBe('</section>\n<!-- END: section:#c -->\n')
    expect(
      close(
        { name: 'chapter', id: 'c', info: ' chapter:c classes:x' },
        'end',
        env
      )
    ).toBe('</section>\n<!-- END: section:#c -->\n')
    expect(
      close({ name: 'dialogue', id: 'd', info: ' dialogue:d' }, 'end', env)
    ).toBe('</section>\n<!-- END: section:#d -->\n')
    expect(
      close(
        { name: 'gallery', id: 'g', info: ' gallery:g' },
        'end',
        envFor('web')
      )
    ).toMatch(/^<\/div>\s+<\/figure>\s+<\/div>\s+<\/section>/)
  })
})
