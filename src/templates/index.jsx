
/* eslint-disable max-len, operator-linebreak */

import File from 'vinyl'
import mime from 'mime-types'
import { find } from 'lodash'
import Props from '../modules/props'
import { fileid, guid, getFrontmatter, getImageOrientation, metadata } from '../utils'
import * as figures from './figures'

const container = `<?xml version="1.0"?>
  <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
      <rootfile full-path="OPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
  </container>`

const mimetype = 'application/epub+zip'
const scriptTag = '<script type="application/javascript" src="{% body %}"></script>'
const stylesheetTag = '<link rel="stylesheet" type="text/css" href="{% body %}"/>'

const pageHead = name => `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <html xmlns="http://www.w3.org/1999/xhtml"
    xmlns:epub="http://www.idpf.org/2007/ops"
    xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0"
    epub:prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">
    <head>
      <title></title>
      <meta http-equiv="default-style" content="text/html charset=utf-8"/>
      <!-- inject:css -->
      <!-- end:css -->
    </head>
    <body${getFrontmatter({ name }, 'template') ? ` class="${getFrontmatter({ name }, 'template')}"` : ''}>`

const pageTail = () => `<!-- inject:js -->
      <!-- end:js -->
    </body>
    </html>`

const pageBody = new File({
  path: 'base.tmpl',
  contents: new Buffer('{% body %}')
})

const page = new File({
  path: 'base.tmpl',
  contents: new Buffer(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <html xmlns="http://www.w3.org/1999/xhtml"
    xmlns:epub="http://www.idpf.org/2007/ops"
    xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0"
    epub:prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">
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

function figure(data, env) {
  const { width, height } = data
  const type = !env || !{}.hasOwnProperty.call(figures, env) ? 'epub' : env
  const format = getImageOrientation(width, height)
  return figures[type][format](data)
}

const loiLeader = () =>
  `<section epub:type="loi" title="LIST OF ILLUSTRATIONS" class="chapter figures">
    <header>
      <h1>Figures</h1>
    </header>
  </section>`

const opfPackage = new File({
  path: 'opfPackage.tmpl',
  contents: new Buffer(`<?xml version="1.0" encoding="UTF-8"?>
    <package version="3.0" xml:lang="en" unique-identifier="uuid" xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0/">
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
  contents: new Buffer('<spine toc="_toc.ncx">{% body %}</spine>')
})

const opfGuide = new File({
  path: 'opfGuide.tmpl',
  contents: new Buffer('<guide>{% body %}</guide>')
})

const ncxHead = () => {
  const entry = find(metadata(), { term: 'identifier' })
  const identifier = entry && {}.hasOwnProperty.call(entry, 'value') ? entry.value : ''
  return `<head>
    <meta name="dtb:uid" content="${identifier}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="1"/>
    <meta name="dtb:maxPageNumber" content="1"/>
  </head>`
}

const ncxTitle = () => {
  const entry = find(metadata(), { term: 'title' })
  const title = entry && {}.hasOwnProperty.call(entry, 'value') ? entry.value : ''
  return `<docTitle>
    <text>${title}</text>
  </docTitle>`
}

const ncxAuthor = () => {
  const entry = find(metadata(), { term: 'creator' })
  const creator = entry && {}.hasOwnProperty.call(entry, 'value') ? entry.value : ''
  return `<docAuthor>
    <text>${creator}</text>
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

const tocTmpl = new File({
  path: 'tocTmpl.tmpl',
  contents: new Buffer(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
    <html xmlns="http://www.w3.org/1999/xhtml"
    xmlns:epub="http://www.idpf.org/2007/ops"
    xmlns:ibooks="http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0"
    epub:prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0">
    <head>
      <title></title>
      <meta http-equiv="default-style" content="text/html charset=utf-8"/>
    </head>
    <body>
      <nav id="toc" epub:type="toc">
        <h2>Table of Contents</h2>
        {% body %}
      </nav>
    </body>
    </html>`)
})

const navPoint = (list) => {
  let i = 0
  function render(arr) {
    return arr.map((_) => {
      i++ // eslint-disable-line no-plusplus
      return `<navPoint id="navPoint-${i}" playOrder="${i}">
      <navLabel><text>${_.title}</text></navLabel>
      <content src="text/${_.filename}"/>
      ${render(_.children)}
      </navPoint>`
    }).join('').replace(/\s*\n\s*/g, '')
  }
  return render(list)
}

const tocitem = (list) => {
  function render(arr) {
    return `<ol>
      ${arr.map(_ =>
        `<li><a href="text/${_.filename}">${_.title}</a>
        ${render(_.children)}
        </li>`).join('')}</ol>`.replace(/\s*\n\s*/g, '')
  }
  return render(list)
}

const item = (file) => {
  const props = Props.testHTML(file)
  let res = null
  if (mime.lookup(file.rootpath) !== 'application/oebps-package+xml') {
    res = [
      `<item id="${fileid(file.name)}"`,
      `href="${encodeURI(file.opspath)}"`,
      `media-type="${mime.lookup(file.rootpath)}"`,
      (props && props.length ? `properties="${props.join(' ')}"` : ''),
      '/>'
    ]
    .filter(Boolean)
    .join(' ')
  }
  return res
}

const itemref = (file) => {
  let res = null
  if (mime.lookup(file.rootpath) === 'text/html' || mime.lookup(file.rootpath) === 'application/xhtml+xml') {
    res = `<itemref idref="${fileid(file.name)}" linear="yes"/>`
  }
  return res
}

const reference = (file) => {
  let res = null
  if (mime.lookup(file.rootpath) === 'text/html' || mime.lookup(file.rootpath) === 'application/xhtml+xml') {
    if (getFrontmatter(file, 'landmark_type')) {
      res = [
        '<reference',
        ` type="${getFrontmatter(file, 'landmark_type')}"`,
        ` title="${getFrontmatter(file, 'landmark_title')}"`,
        ` href="${encodeURI(file.opspath)}"/>`
      ].join('')
    }
  }
  return res
}

const metatag = (data) => {
  const { term, element } = Props.testMeta(data)
  const itemid = element && data.term === 'identifier' ? 'uuid' : `_${guid()}`
  const res = []
  if (term) { res.push(`<meta property="dcterms:${data.term}">${data.value}</meta>`) }
  if (element) { res.push(`<dc:${data.term} id="${itemid}">${data.value}</dc:${data.term}>`) }
  if (term
      && element
      && {}.hasOwnProperty.call(data, 'term_property')
      && {}.hasOwnProperty.call(data, 'term_property_value')) {
    res.push(`<meta refines="#${itemid}" property="${data.term_property}">${data.term_property_value}</meta>`)
  }
  if (!term && !element) { res.push(`<meta name="${data.term}" content="${data.value}"/>`) }
  return res.join('')
}

export {
  container,
  mimetype,
  page,
  pageBody,
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
  navPoint,
  metatag,
  tocitem,
  tocTmpl,
  figure,
  loiLeader,
  pageHead,
  pageTail
}
