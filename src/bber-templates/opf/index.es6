
/* eslint-disable operator-linebreak */

import File from 'vinyl'
import mime from 'mime-types'
import Props from 'bber-lib/props'
import { fileId, guid, getFrontmatter } from 'bber-utils'

const opfPackage = new File({
  path: 'opfPackage.tmpl',
  contents: new Buffer(`<?xml version="1.0" encoding="UTF-8"?>
    <package
      version="3.0"
      xml:lang="en"
      unique-identifier="uuid"
      xmlns="http://www.idpf.org/2007/opf"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:dcterms="http://purl.org/dc/terms/"
      prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0/">
      {% body %}
    </package>`),
})

const opfMetadata = new File({
  path: 'opfMetadata.tmpl',
  contents: new Buffer('<metadata>{% body %}</metadata>'),
})

const opfManifest = new File({
  path: 'opfManifest.tmpl',
  contents: new Buffer('<manifest>{% body %}</manifest>'),
})

const opfSpine = new File({
  path: 'opfSpine.tmpl',
  contents: new Buffer('<spine toc="toc.ncx">{% body %}</spine>'),
})

const opfGuide = new File({
  path: 'opfGuide.tmpl',
  contents: new Buffer('<guide>{% body %}</guide>'),
})

const manifestItem = (file) => {
  const props = Props.testHTML(file)
  let res = null
  if (mime.lookup(file.rootPath) !== 'application/oebps-package+xml') {
    res = [
      `<item id="${fileId(file.name)}"`,
      `href="${encodeURI(file.opsPath)}"`,
      `media-type="${mime.lookup(file.rootPath)}"`,
      (props && props.length ? `properties="${props.join(' ')}"` : ''),
      '/>',
    ]
    .filter(Boolean)
    .join(' ')
  }
  return res
}

const spineItems = arr =>
  arr.map((_) => {
    let res = ''
    if (mime.lookup(_.rootPath) === 'text/html'
        || mime.lookup(_.rootPath) === 'application/xhtml+xml') {
      res = `\n<itemref idref="${fileId(_.name)}" linear="${_.linear || 'yes'}"/>`
    }
    return res
  }).join('')

const guideItems = arr =>
  arr.map((_) => {
    let item = ''
    if (mime.lookup(_.rootPath) === 'text/html'
        || mime.lookup(_.rootPath) === 'application/xhtml+xml') {
      if (getFrontmatter(_, 'type')) {
        item = [
          '\n<reference',
          ` type="${getFrontmatter(_, 'type')}"`,
          ` title="${getFrontmatter(_, 'title')}"`,
          ` href="${encodeURI(_.opsPath)}"/>`,
        ].join('')
      }
    }
    return item
  }).join('')

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
    res.push(`<meta refines="#${itemid}" property="${data.term_property}">${data.term_property_value}</meta>`) // eslint-disable-line max-len
  }
  if (!term && !element) { res.push(`<meta name="${data.term}" content="${data.value}"/>`) }
  return res.join('')
}

export { opfPackage, opfMetadata, opfManifest, opfSpine, opfGuide,
  manifestItem, spineItems, guideItems, metatag }
