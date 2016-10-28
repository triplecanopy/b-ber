
import File from 'vinyl'
import mime from 'mime-types'
import Attrs from './attrs'
import { fileid } from './utils'

const container = `<?xml version="1.0"?>
    <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
      <rootfiles>
        <rootfile full-path="OPS/content.opf" media-type="application/oebps-package+xml"/>
      </rootfiles>
    </container>`

const mimetype = 'application/epub+zip'
const scriptTag = '<script type="application/javascript" src="{% body %}"></script>'
const stylesheetTag = '<link type="text/css" href="{% body %}"/>'

const page = new File({
  path: 'base.tmpl',
  contents: new Buffer(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <html xmlns="http://www.w3.org/1999/xhtml"
    xmlns:epub="http://www.idpf.org/2007/ops"
    xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0"
    epub:prefix="ibooks:http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">
    <head>
      <title></title>
      <meta http-equiv="default-style" content="text/html charset=utf-8"/>
      <!-- inject:css -->
      <!-- end:css -->
    </head>
    <body>
      {% body %}
      <!-- inject:js -->
      <!-- end:js -->
    </body>
    </html>`)
})

const opfPackage = new File({
  path: 'opfPackage.tmpl',
  contents: new Buffer(`<?xml version="1.0" encoding="UTF-8"?>
    <package version="3.0" xml:lang="en" unique-identifier="uuid" xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" prefix="ibooks:http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0/">
      {% body %}
    </package>`)
})

const opfMetadata = new File({
  path: 'opfMetadata.tmpl',
  contents: new Buffer('<metadata>{% body %}</metadata>')
})

const opfManifest = new File({
  path: 'opfManifest.tmpl',
  contents: new Buffer('<manifest>{% body %}</manifest>')
})

const opfSpine = new File({
  path: 'opfSpine.tmpl',
  contents: new Buffer('<spine>{% body %}</spine>')
})

const opfGuide = new File({
  path: 'opfGuide.tmpl',
  contents: new Buffer('<guide>{% body %}</guide>')
})

function item(file) {
  let res = null
  if (mime.lookup(file.fullpath) !== 'application/oebps-package+xml') {
    res = `<item id="${fileid(file.name)}" href="${encodeURI(file.toppath)}" media-type="${mime.lookup(file.fullpath)}" attributes="${Attrs.test(file)}"/>`
  }
  return res
}

function itemref(file) {
  let res = null
  if (mime.lookup(file.fullpath) === 'text/html' || mime.lookup(file.fullpath) === 'application/xhtml+xml') {
    res = `<itemref idref="${fileid(file.name)}" linear="yes"/>`
  }
  return res
}

function reference(file) {
  let res = null
  if (mime.lookup(file.fullpath) === 'text/html' || mime.lookup(file.fullpath) === 'application/xhtml+xml') {
    res = `<reference type="" title="" href="${encodeURI(file.toppath)}"/>`
  }
  return res
}

export {
  container,
  mimetype,
  page,
  opfPackage,
  opfMetadata,
  opfManifest,
  opfSpine,
  opfGuide,
  item,
  itemref,
  reference,
  scriptTag,
  stylesheetTag
}
