import Request from '../../src/helpers/Request'
import XMLAdaptor from '../../src/helpers/XMLAdaptor'
import { BookMetadata, GuideItem, SpineItem } from '../../src/models'

jest.mock('../../src/helpers/Request')

const opsURL = 'http://example.com/OPS'

const opfXML = `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xml:lang="en" unique-identifier="uuid" xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/">
<metadata>
<dc:title>Title One</dc:title>
<dc:creator>Author One</dc:creator>
<dc:date>2020-01-01</dc:date>
<dc:publisher>Publisher One</dc:publisher>
<dc:description>Description One</dc:description>
<dc:language>en</dc:language>
<dc:rights>All rights reserved</dc:rights>
<dc:identifier>urn:uuid:1234</dc:identifier>
<dc:format>application/epub+zip</dc:format>
<meta name="cover" content="cover-image"/>
</metadata>
<manifest>
<item id="toc_ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
<item id="item_one" href="text/item-one.xhtml" media-type="application/xhtml+xml" properties="svg"/>
<item id="item_two" href="text/item-two.xhtml" media-type="application/xhtml+xml"/>
<item id="item_three" href="text/item-three.xhtml" media-type="application/xhtml+xml"/>
</manifest>
<spine toc="toc_ncx">
<itemref idref="item_one" linear="yes"/>
<itemref idref="item_two" linear="yes"/>
<itemref idref="item_three" linear="no"/>
</spine>
<guide>
<reference type="bodymatter" title="Item One" href="text/item-one.xhtml"/>
</guide>
</package>`

const opfXMLNoToc = `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xml:lang="en" unique-identifier="uuid" xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/">
<metadata>
<dc:title>Title Two</dc:title>
</metadata>
<manifest>
<item id="item_one" href="text/item-one.xhtml" media-type="application/xhtml+xml"/>
</manifest>
<spine toc="">
<itemref idref="item_one" linear="yes"/>
</spine>
<guide>
</guide>
</package>`

const opfXMLBadToc = `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xml:lang="en" unique-identifier="uuid" xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/">
<metadata>
<dc:title>Title Three</dc:title>
</metadata>
<manifest>
<item id="item_one" href="text/item-one.xhtml" media-type="application/xhtml+xml"/>
</manifest>
<spine toc="missing_toc">
<itemref idref="item_one" linear="yes"/>
</spine>
<guide>
</guide>
</package>`

const ncxXML = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
<navMap>
<navPoint id="navpoint-1" playOrder="1">
<navLabel><text>Item One</text></navLabel>
<content src="text/item-one.xhtml"/>
<navPoint id="navpoint-2" playOrder="2">
<navLabel><text>Item Two</text></navLabel>
<content src="text/item-two.xhtml"/>
</navPoint>
</navPoint>
</navMap>
</ncx>`

describe('XMLAdaptor', () => {
  describe('opfURL', () => {
    test('builds an OPF url from a base url', () => {
      expect(XMLAdaptor.opfURL('http://example.com')).toBe(
        'http://example.com/OPS/content.opf'
      )
    })

    test('strips a trailing slash before appending', () => {
      expect(XMLAdaptor.opfURL('http://example.com/')).toBe(
        'http://example.com/OPS/content.opf'
      )
    })
  })

  describe('opsURL', () => {
    test('builds an OPS url from a base url', () => {
      expect(XMLAdaptor.opsURL('http://example.com')).toBe(
        'http://example.com/OPS'
      )
    })

    test('strips a trailing slash before appending', () => {
      expect(XMLAdaptor.opsURL('http://example.com/')).toBe(
        'http://example.com/OPS'
      )
    })
  })

  describe('parseOPF', () => {
    test('parses opf data into top-level keys', async () => {
      const resp = await XMLAdaptor.parseOPF({ data: opfXML })

      expect(resp).toEqual(
        expect.objectContaining({
          __metadata: expect.objectContaining({
            name: 'metadata',
            elements: expect.any(Array),
          }),
          __manifest: expect.objectContaining({
            name: 'manifest',
            elements: expect.any(Array),
          }),
          __spine: expect.objectContaining({
            name: 'spine',
            elements: expect.any(Array),
          }),
          __guide: expect.objectContaining({
            name: 'guide',
            elements: expect.any(Array),
          }),
        })
      )
    })
  })

  describe('parseNCX', () => {
    afterEach(() => {
      jest.clearAllMocks()
    })

    test('resolves with __ncx: null when __spine has no toc attribute', async () => {
      const rootNode = await XMLAdaptor.parseOPF({ data: opfXMLNoToc })
      const resp = await XMLAdaptor.parseNCX(rootNode, opsURL)

      expect(resp).toEqual({ ...rootNode, __ncx: null })
      expect(Request.getText).not.toHaveBeenCalled()
    })

    test('resolves with __ncx: null when toc has no matching manifest item', async () => {
      const rootNode = await XMLAdaptor.parseOPF({ data: opfXMLBadToc })
      const resp = await XMLAdaptor.parseNCX(rootNode, opsURL)

      expect(resp).toEqual({ ...rootNode, __ncx: null })
      expect(Request.getText).not.toHaveBeenCalled()
    })

    test('fetches and parses the ncx document when toc resolves', async () => {
      Request.getText.mockResolvedValue({ data: ncxXML })

      const rootNode = await XMLAdaptor.parseOPF({ data: opfXML })
      const resp = await XMLAdaptor.parseNCX(rootNode, opsURL)

      expect(Request.getText).toHaveBeenCalledWith(`${opsURL}/toc.ncx`)
      expect(resp.__ncx).toEqual(
        expect.objectContaining({
          elements: expect.any(Array),
        })
      )
      expect(resp.__manifest).toBe(rootNode.__manifest)
      expect(resp.__spine).toBe(rootNode.__spine)
    })
  })

  describe('createSpineItems', () => {
    test('builds spine items, skipping non-linear and unmatched entries', async () => {
      const rootNode = await XMLAdaptor.parseOPF({ data: opfXML })
      const resp = await XMLAdaptor.createSpineItems(rootNode)

      // item_three is linear="no" and should be excluded
      expect(resp.spine).toHaveLength(2)
      for (const item of resp.spine) {
        expect(item).toBeInstanceOf(SpineItem)
      }

      const [first, second] = resp.spine
      expect(first.id).toBe('item_one')
      expect(first.href).toBe('text/item-one.xhtml')
      expect(first.mediaType).toBe('application/xhtml+xml')
      expect(first.properties).toEqual(['svg'])

      // first item has a matching guide reference - title/slug pulled from guide
      expect(first.title).toBe('Item One')
      expect(first.slug).toBe('item-one')

      // second item has no matching guide reference
      expect(second.id).toBe('item_two')
      expect(second.title).toBe('')
      expect(second.slug).toBe('')
    })

    test('parses nav points from __ncx when present', async () => {
      Request.getText.mockResolvedValue({ data: ncxXML })

      let rootNode = await XMLAdaptor.parseOPF({ data: opfXML })
      rootNode = await XMLAdaptor.parseNCX(rootNode, opsURL)
      const resp = await XMLAdaptor.createSpineItems(rootNode)

      const itemOne = resp.spine.find((a) => a.id === 'item_one')
      const itemTwo = resp.spine.find((a) => a.id === 'item_two')

      // navMap title should win for item_one (overridden via navPoint, but
      // guide already set title so it should remain "Item One")
      expect(itemOne.title).toBe('Item One')
      expect(itemOne.inTOC).toBe(true)
      expect(itemOne.depth).toBe(0)
      // item_two is a nested navPoint child of item_one
      expect(itemOne.children).toHaveLength(1)
      expect(itemOne.children[0].id).toBe('item_two')

      expect(itemTwo.title).toBe('Item Two')
      expect(itemTwo.slug).toBe('item-two')
      expect(itemTwo.depth).toBe(1)
      expect(itemTwo.inTOC).toBe(true)

      jest.clearAllMocks()
    })

    test('handles a spine with no manifest match (returns empty spine)', async () => {
      const rootNode = await XMLAdaptor.parseOPF({ data: opfXMLNoToc })
      // Remove the manifest item so the spine itemref can't be matched
      rootNode.__manifest.elements = []

      const resp = await XMLAdaptor.createSpineItems(rootNode)
      expect(resp.spine).toEqual([])
    })
  })

  describe('createGuideItems', () => {
    test('returns an empty guide array when __guide has no elements', async () => {
      const rootNode = await XMLAdaptor.parseOPF({ data: opfXMLNoToc })
      const resp = await XMLAdaptor.createGuideItems(rootNode)

      expect(resp.guide).toEqual([])
    })

    test('maps __guide references to GuideItems', async () => {
      const rootNode = await XMLAdaptor.parseOPF({ data: opfXML })
      const resp = await XMLAdaptor.createGuideItems(rootNode)

      expect(resp.guide).toHaveLength(1)
      expect(resp.guide[0]).toBeInstanceOf(GuideItem)
      expect(resp.guide[0]).toEqual(
        expect.objectContaining({
          type: 'bodymatter',
          title: 'Item One',
          href: 'text/item-one.xhtml',
        })
      )
    })
  })

  describe('udpateSpineItemURLs', () => {
    test('sets absoluteURL on each spine item', async () => {
      const rootNode = await XMLAdaptor.parseOPF({ data: opfXML })
      const withSpine = await XMLAdaptor.createSpineItems(rootNode)
      const resp = await XMLAdaptor.udpateSpineItemURLs(withSpine, opsURL)

      resp.spine.forEach((item) => {
        expect(item.absoluteURL).toBe(`${opsURL}/${item.href}`)
      })
    })
  })

  describe('udpateGuideItemURLs', () => {
    test('sets absoluteURL on each guide item', async () => {
      const rootNode = await XMLAdaptor.parseOPF({ data: opfXML })
      const withGuide = await XMLAdaptor.createGuideItems(rootNode)
      const resp = await XMLAdaptor.udpateGuideItemURLs(withGuide, opsURL)

      resp.guide.forEach((item) => {
        expect(item.absoluteURL).toBe(`${opsURL}/${item.href}`)
      })
    })
  })

  describe('parseNavPoints', () => {
    let manifest
    let spine

    beforeEach(() => {
      manifest = {
        elements: [
          {
            attributes: { id: 'item_one', href: 'text/item-one.xhtml' },
          },
          {
            attributes: { id: 'item_two', href: 'text/item-two.xhtml' },
          },
        ],
      }

      spine = [
        new SpineItem({
          id: 'item_one',
          href: 'text/item-one.xhtml',
          mediaType: 'application/xhtml+xml',
          properties: [],
          idref: 'item_one',
          linear: 'yes',
        }),
        new SpineItem({
          id: 'item_two',
          href: 'text/item-two.xhtml',
          mediaType: 'application/xhtml+xml',
          properties: [],
          idref: 'item_two',
          linear: 'yes',
        }),
      ]
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    const buildNavPoint = ({ src, title, children = [] }) => ({
      elements: [
        {
          name: 'navLabel',
          elements: [
            {
              name: 'text',
              elements: [{ type: 'text', text: title }],
            },
          ],
        },
        {
          name: 'content',
          attributes: { src },
        },
        ...children,
      ],
    })

    test('returns early when navPoint has no content element', () => {
      const navPoint = {
        elements: [{ name: 'navLabel', elements: [] }],
      }

      expect(() =>
        XMLAdaptor.parseNavPoints(spine, manifest, navPoint)
      ).not.toThrow()

      // nothing should have been mutated
      expect(spine[0].title).toBe('')
    })

    test('logs an error and returns when no manifest item matches', () => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const navPoint = buildNavPoint({
        src: 'text/missing.xhtml',
        title: 'Missing',
      })

      XMLAdaptor.parseNavPoints(spine, manifest, navPoint)

      expect(errSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not find manifest item')
      )
      expect(spine[0].title).toBe('')
    })

    test('logs an error and returns when no spine item matches the manifest item', () => {
      const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      manifest.elements.push({
        attributes: { id: 'item_three', href: 'text/item-three.xhtml' },
      })

      const navPoint = buildNavPoint({
        src: 'text/item-three.xhtml',
        title: 'Item Three',
      })

      XMLAdaptor.parseNavPoints(spine, manifest, navPoint)

      expect(errSpy).toHaveBeenCalledWith(
        expect.stringContaining('Can not find spine item')
      )
    })

    test('sets title/slug/depth/inTOC on the matching spine item, recurses, and adds children to parent', () => {
      const navPoint = buildNavPoint({
        src: 'text/item-one.xhtml',
        title: 'Item One',
        children: [
          buildNavPoint({ src: 'text/item-two.xhtml', title: 'Item Two' }),
        ],
      })

      XMLAdaptor.parseNavPoints(spine, manifest, navPoint)

      const [itemOne, itemTwo] = spine

      expect(itemOne.title).toBe('Item One')
      expect(itemOne.slug).toBe('item-one')
      expect(itemOne.depth).toBe(0)
      expect(itemOne.inTOC).toBe(true)

      // child navPoint recursed with itemOne as parent
      expect(itemOne.children).toHaveLength(1)
      expect(itemOne.children[0]).toBe(itemTwo)

      expect(itemTwo.title).toBe('Item Two')
      expect(itemTwo.slug).toBe('item-two')
      expect(itemTwo.depth).toBe(1)
      expect(itemTwo.inTOC).toBe(true)
    })

    test('does not overwrite an existing title/slug on the spine item', () => {
      spine[0].set('title', 'Existing Title')
      spine[0].set('slug', 'existing-slug')

      const navPoint = buildNavPoint({
        src: 'text/item-one.xhtml',
        title: 'Item One',
      })

      XMLAdaptor.parseNavPoints(spine, manifest, navPoint)

      expect(spine[0].title).toBe('Existing Title')
      expect(spine[0].slug).toBe('existing-slug')
      // depth/inTOC are always set, regardless of title/slug
      expect(spine[0].depth).toBe(0)
      expect(spine[0].inTOC).toBe(true)
    })

    test('passes the parent through recursive calls when provided', () => {
      const child = buildNavPoint({
        src: 'text/item-two.xhtml',
        title: 'Item Two',
      })
      const navPoint = buildNavPoint({
        src: 'text/item-one.xhtml',
        title: 'Item One',
        children: [child],
      })

      const parent = new SpineItem({
        id: 'parent',
        href: 'text/parent.xhtml',
        mediaType: 'application/xhtml+xml',
        properties: [],
        idref: 'parent',
        linear: 'yes',
      })

      XMLAdaptor.parseNavPoints(spine, manifest, navPoint, 0, parent)

      // top-level navPoint adds itemOne to `parent`
      expect(parent.children).toHaveLength(1)
      expect(parent.children[0]).toBe(spine[0])

      // recursion into the child navPoint adds itemTwo to itemOne (the new parent)
      expect(spine[0].children).toHaveLength(1)
      expect(spine[0].children[0]).toBe(spine[1])
    })
  })

  describe('createBookMetadata', () => {
    test('builds a BookMetadata instance from dc: elements', async () => {
      const rootNode = await XMLAdaptor.parseOPF({ data: opfXML })
      const resp = await XMLAdaptor.createBookMetadata(rootNode)

      expect(resp.metadata).toBeInstanceOf(BookMetadata)
      expect(resp.metadata.title).toBe('Title One')
      expect(resp.metadata.creator).toBe('Author One')
      expect(resp.metadata.date).toBe('2020-01-01')
      expect(resp.metadata.publisher).toBe('Publisher One')
      expect(resp.metadata.description).toBe('Description One')
      expect(resp.metadata.language).toBe('en')
      expect(resp.metadata.rights).toBe('All rights reserved')
      expect(resp.metadata.identifier).toBe('urn:uuid:1234')
    })

    test('ignores dc: elements that have no matching BookMetadata key', async () => {
      // dc:format has no corresponding key on BookMetadata
      const rootNode = await XMLAdaptor.parseOPF({ data: opfXML })
      const resp = await XMLAdaptor.createBookMetadata(rootNode)

      expect(resp.metadata).not.toHaveProperty('format')
    })
  })
})
