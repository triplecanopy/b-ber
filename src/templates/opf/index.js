
/* eslint-disable operator-linebreak */

import File from 'vinyl'
import mime from 'mime-types'
import Props from '../../modules/props'
import { fileid, guid, getFrontmatter } from '../../utils'

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

export { opfPackage, opfMetadata, opfManifest, opfSpine, opfGuide, item,
  itemref, reference, metatag }
