import { GuideItem } from '@canopycanopycanopy/b-ber-lib'
import log from '@canopycanopycanopy/b-ber-logger'
import markdownItFrontmatterPlugin from '../src'

jest.mock('@canopycanopycanopy/b-ber-logger', () => ({
  // Returns an Error, as the real log.error does
  error: jest.fn((message) => new Error(message)),
}))

// The env of the render that found the front matter
const envFor = (fileName) => ({
  document: { fileName },
  result: { guide: [], frontMatter: [] },
})

describe('b-ber-grammar-frontmatter', () => {
  it('exports a function', () => {
    expect(markdownItFrontmatterPlugin).toBeFunction()
  })

  it('calling the factory returns a plugin function', () => {
    expect(markdownItFrontmatterPlugin()).toBeFunction()
  })

  it('collects a guide item for the document', () => {
    const env = envFor('titlepage')
    markdownItFrontmatterPlugin()('title: Test Title\ntype: titlepage', env)
    expect(env.result.guide).toEqual([
      new GuideItem({
        fileName: 'titlepage',
        title: 'Test Title',
        type: 'titlepage',
      }),
    ])
  })

  // The build merges it into the document's spine entry (b-ber-tasks' render)
  it('collects the front matter as parsed', () => {
    const env = envFor('copyright')
    markdownItFrontmatterPlugin()('title: Copyright\nextra: 1', env)
    expect(env.result.frontMatter).toEqual([{ title: 'Copyright', extra: 1 }])
  })

  // #735: front matter is unvalidated author YAML, and a guide item was made
  // from it whatever it held
  describe('validating the guide item (#735)', () => {
    it('throws, naming the file, for a type with no title', () => {
      const env = envFor('colophon')
      expect(() =>
        markdownItFrontmatterPlugin()('type: colophon', env)
      ).toThrow(
        'Front matter in [_markdown/colophon.md] has a [type] but no [title]'
      )
      expect(log.error).toHaveBeenCalledWith(
        expect.stringContaining('_markdown/colophon.md')
      )
      expect(env.result.guide).toEqual([])
    })

    it('throws for an empty title', () => {
      expect(() =>
        markdownItFrontmatterPlugin()('type: colophon\ntitle: ""', envFor('c'))
      ).toThrow('has a [type] but no [title]')
    })

    // The OPF's guide never listed an item without a type
    it('makes no guide item for front matter with no type', () => {
      const env = envFor('chapter-01')
      markdownItFrontmatterPlugin()('title: Chapter One', env)
      expect(env.result.guide).toEqual([])
      expect(env.result.frontMatter).toEqual([{ title: 'Chapter One' }])
    })

    it('collects nothing from front matter that is not a mapping', () => {
      for (const meta of ['', 'just a line', '- a\n- b']) {
        const env = envFor('odd')
        markdownItFrontmatterPlugin()(meta, env)
        expect(env.result).toEqual({ guide: [], frontMatter: [] })
      }
    })

    it('keeps a title that YAML reads as a number', () => {
      const env = envFor('n')
      markdownItFrontmatterPlugin()('title: 1984\ntype: bodymatter', env)
      expect(env.result.guide[0]).toMatchObject({ title: '1984' })
    })
  })
})
