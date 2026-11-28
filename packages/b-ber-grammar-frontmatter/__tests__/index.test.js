import { GuideItem } from '@canopycanopycanopy/b-ber-lib'
import markdownItFrontmatterPlugin from '../src'

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
})
