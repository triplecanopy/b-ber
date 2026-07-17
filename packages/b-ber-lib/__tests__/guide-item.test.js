import GuideItem from '../src/GuideItem'

describe('GuideItem constructor', () => {
  it('stores fileName, title, and type', () => {
    const item = new GuideItem({
      fileName: 'toc.xhtml',
      title: 'Table of Contents',
      type: 'toc',
    })
    expect(item.fileName).toBe('toc.xhtml')
    expect(item.title).toBe('Table of Contents')
    expect(item.type).toBe('toc')
  })

  it('stores undefined for omitted properties', () => {
    const item = new GuideItem({ fileName: 'cover.xhtml' })
    expect(item.fileName).toBe('cover.xhtml')
    expect(item.title).toBeUndefined()
    expect(item.type).toBeUndefined()
  })
})
