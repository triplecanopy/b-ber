import path from 'path'
import SpineItem from '../src/SpineItem'

const defaults = { fileName: 'chapter-01', buildType: 'epub' }

describe('SpineItem.isNavigationDocument', () => {
  it('returns true for "toc"', () => {
    expect(SpineItem.isNavigationDocument('toc')).toBe(true)
  })

  it('returns true for "nav"', () => {
    expect(SpineItem.isNavigationDocument('nav')).toBe(true)
  })

  it('returns false for other filenames', () => {
    expect(SpineItem.isNavigationDocument('chapter-01')).toBe(false)
    expect(SpineItem.isNavigationDocument('toc-extended')).toBe(false)
  })
})

describe('SpineItem constructor', () => {
  it('stores fileName', () => {
    expect(new SpineItem(defaults).fileName).toBe('chapter-01')
  })

  it('defaults in_toc to true', () => {
    // eslint-disable-next-line camelcase
    expect(new SpineItem(defaults).in_toc).toBe(true)
  })

  it('defaults linear to true', () => {
    expect(new SpineItem(defaults).linear).toBe(true)
  })

  it('defaults pageOrder to -1', () => {
    expect(new SpineItem(defaults).pageOrder).toBe(-1)
  })

  it('defaults generated to false', () => {
    expect(new SpineItem(defaults).generated).toBe(false)
  })

  it('defaults nodes to an empty array', () => {
    expect(new SpineItem(defaults).nodes).toEqual([])
  })

  it('defaults ref to null', () => {
    expect(new SpineItem(defaults).ref).toBeNull()
  })

  it('respects provided in_toc value', () => {
    // eslint-disable-next-line camelcase
    expect(new SpineItem({ ...defaults, in_toc: false }).in_toc).toBe(false)
  })

  it('respects provided linear value', () => {
    expect(new SpineItem({ ...defaults, linear: false }).linear).toBe(false)
  })

  it('respects provided pageOrder', () => {
    expect(new SpineItem({ ...defaults, pageOrder: 3 }).pageOrder).toBe(3)
  })

  it('ignores non-numeric pageOrder and uses -1', () => {
    expect(new SpineItem({ ...defaults, pageOrder: 'first' }).pageOrder).toBe(
      -1
    )
  })

  it('derives title from fileName via startCase', () => {
    expect(new SpineItem(defaults).title).toBe('Chapter 01')
  })

  it('uses a provided title over the derived one', () => {
    expect(new SpineItem({ ...defaults, title: 'My Chapter' }).title).toBe(
      'My Chapter'
    )
  })

  it('sets relativePath to text/<fileName> for normal files', () => {
    expect(new SpineItem(defaults).relativePath).toBe(
      path.join('text', 'chapter-01')
    )
  })

  it('sets relativePath to just fileName for navigation documents', () => {
    const item = new SpineItem({ fileName: 'toc', buildType: 'epub' })
    expect(item.relativePath).toBe('toc')
  })

  it('includes the buildType in absolutePath', () => {
    expect(new SpineItem(defaults).absolutePath).toContain('project-epub')
  })

  it('parses extension from fileName', () => {
    const item = new SpineItem({
      fileName: 'chapter-01.xhtml',
      buildType: 'epub',
    })
    expect(item.extension).toBe('.xhtml')
    expect(item.name).toBe('chapter-01')
  })

  it('sets extension to empty string for filenames without extension', () => {
    expect(new SpineItem(defaults).extension).toBe('')
  })
})
