import XMLAdaptor from '../../src/helpers/XMLAdaptor'

const xml = {
  data: `<?xml version="1.0" encoding="UTF-8"?>
        <package version="3.0" xml:lang="en" unique-identifier="uuid" xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0/">
        <metadata>
        <dc:title>title</dc:title>
        </metadata>
        <manifest>
        <item id="toc_ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        <item id="item_one" href="text/item-one.xhtml" media-type="application/xhtml+xml"/>
        </manifest>
        <spine toc="toc_ncx">
        <itemref idref="item_one" linear="yes"/>
        </spine>
        <guide>
        <reference type="bodymatter" title="Item One" href="text/item-one.xhtml"/>
        </guide>
        </package>`,
}

describe('XMLAdaptor', () => {
  test('parses opf data', done => {
    XMLAdaptor.parseOPF(xml).then(resp => {
      expect(resp).toEqual({
        __metadata: expect.objectContaining({
          name: expect.stringMatching(/^metadata$/),
          elements: expect.any(Array),
        }),
        __manifest: expect.objectContaining({
          name: expect.stringMatching(/^manifest$/),
          elements: expect.any(Array),
        }),
        __guide: expect.objectContaining({
          name: expect.stringMatching(/^guide$/),
          elements: expect.any(Array),
        }),
        __spine: expect.objectContaining({
          name: expect.stringMatching(/^spine$/),
          elements: expect.any(Array),
        }),
      })

      done()
    })
  })

  // parseNCX
  // @issue: https://github.com/triplecanopy/b-ber/issues/223
  test.todo('parses ncx data')

  // TODO: resolve network error
  test.todo('creates spine object')

  // test('creates spine object', done => {
  //     XMLAdaptor.parseOPF(xml).then(data =>
  //         XMLAdaptor.createSpineItems(data)
  //             .then(resp => XMLAdaptor.parseNCX(resp, opsURL))
  //             .then(resp => {
  //                 expect(resp).toEqual(
  //                     expect.objectContaining({
  //                         __manifest: expect.any(Object),
  //                         __spine: expect.any(Object),
  //                         // __ncx: expect.any(Object),
  //                     }),
  //                 )

  //                 done()
  //             }),
  //     )
  // })
})
