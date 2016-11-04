
/* eslint-disable max-len  */

import File from 'vinyl'
import mime from 'mime-types'
import YAML from 'yamljs'
import path from 'path'
import { findWhere } from 'underscore'
import conf from './config'
import Attrs from './attrs'
import { fileid } from './utils'

const settings = (() => {
  const meta = path.join(__dirname, `../${conf.src}`, 'metadata.yml')
  try {
    if (meta) {
      return YAML.load(meta)
    }
  } catch (e) {
    throw new Error(e.message)
  }
  return false
})()

function getMeta(key) {
  const res = findWhere(settings, { term: key })
  if (res && res.value) { return res.value }
  return false
}

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

function ncxHead() {
  return `<head>
    <meta name="dtb:uid" content="urn:isbn:${getMeta('identifier')}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="1"/>
    <meta name="dtb:maxPageNumber" content="1"/>
  </head>`
}

function ncxTitle() {
  return `<docTitle>
    <text>${getMeta('title')}</text>
  </docTitle>`
}

function ncxAuthor() {
  return `<docAuthor>
    <text>${getMeta('creator')}</text>
  </docAuthor>`
}

const ncxTmpl = new File({
  path: 'ncxTmpl.tmpl',
  contents: new Buffer(`<?xml version="1.0" encoding="UTF-8"?>
    <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
      ${ncxHead()}
      ${ncxTitle()}
      ${ncxAuthor()}
        <navMap>
          {% body %}
        </navMap>
      </ncx>`)
})

function navPoint(list) {
  let count = 0
  function render(arr) {
    let res = String('')
    arr.forEach((entry) => {
      count += 1
      res += `<navPoint id="navPoint-${count}" playOrder="${count}">`
      res += '<navLabel>'
      res += `<text>${entry.title}</text>`
      res += '</navLabel>'
      res += `<content src="text/${entry.filename}"/>`
      if (entry.children.length) { res += render(entry.children) }
      res += '</navPoint>'
    })
    return res
  }
  return render(list)
}

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
  stylesheetTag,
  ncxTmpl,
  navPoint
}
