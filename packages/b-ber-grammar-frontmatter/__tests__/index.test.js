import state from '@canopycanopycanopy/b-ber-lib/State'
import { GuideItem } from '@canopycanopycanopy/b-ber-lib'
import markdownItFrontmatterPlugin from '../src'

jest.mock('@canopycanopycanopy/b-ber-lib', () => ({
  GuideItem: jest.fn().mockImplementation(data => data),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/YamlAdaptor', () => ({
  parse: jest.fn(() => ({ title: 'Test Title' })),
}))

jest.mock('@canopycanopycanopy/b-ber-lib/State', () => ({
  add: jest.fn(),
  spine: {
    frontMatter: {
      get: jest.fn(() => null),
      set: jest.fn(),
    },
  },
}))

afterEach(() => {
  jest.clearAllMocks()
})

describe('b-ber-grammar-frontmatter', () => {
  it('exports a function', () => {
    expect(markdownItFrontmatterPlugin).toBeFunction()
  })

  it('calling factory with self returns a plugin function', () => {
    const self = { fileName: 'titlepage' }
    const plugin = markdownItFrontmatterPlugin(self)
    expect(plugin).toBeFunction()
  })

  it('plugin calls state.add with guide and a GuideItem', () => {
    const self = { fileName: 'titlepage' }
    const plugin = markdownItFrontmatterPlugin(self)
    plugin('title: Test Title')
    expect(GuideItem).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: 'titlepage', title: 'Test Title' })
    )
    expect(state.add).toHaveBeenCalledWith('guide', expect.anything())
  })

  it('plugin does not call state.spine.frontMatter.set when get returns null', () => {
    // state is imported at top level
    state.spine.frontMatter.get.mockReturnValue(null)
    const self = { fileName: 'copyright' }
    const plugin = markdownItFrontmatterPlugin(self)
    plugin('title: Copyright')
    expect(state.spine.frontMatter.set).not.toHaveBeenCalled()
  })

  it('plugin merges and calls state.spine.frontMatter.set when get returns existing data', () => {
    // state is imported at top level
    const existingData = { fileName: 'titlepage', someExisting: 'value' }
    state.spine.frontMatter.get.mockReturnValue(existingData)
    const self = { fileName: 'titlepage' }
    const plugin = markdownItFrontmatterPlugin(self)
    plugin('title: Test Title')
    expect(state.spine.frontMatter.set).toHaveBeenCalledWith(
      'titlepage',
      expect.objectContaining({ title: 'Test Title' })
    )
  })
})
