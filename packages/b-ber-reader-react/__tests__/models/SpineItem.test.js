import SpineItem from '../../src/models/SpineItem'

describe('SpineItem', () => {
  test('creates a spine item', () => {
    const data = {
      id: 'a',
      href: 'b',
      mediaType: 'c',
      properties: [],
      idref: 'd',
      linear: true,
    }
    const spineItem = new SpineItem(data)

    expect(spineItem).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        href: expect.any(String),
        mediaType: expect.any(String),
        properties: expect.any(Array),
        idref: expect.any(String),
        linear: expect.any(Boolean),
        absoluteURL: expect.any(String),
        title: expect.any(String),
        slug: expect.any(String),
        depth: expect.any(Number),
        children: expect.any(Array),
        addChild: expect.any(Function),
      })
    )

    spineItem.addChild(1)
    spineItem.addChild(2)
    expect(spineItem.children).toEqual([1, 2])

    expect(spineItem.id).toBe('a')

    spineItem.set('id', 'x')
    expect(spineItem.get('id')).toBe('x')
  })
})
