/* eslint-disable operator-linebreak */

import File from 'vinyl'
import mime from 'mime-types'
import Props from 'bber-lib/props'
import { fileId, guid, getFrontmatter, escapeHTML } from 'bber-utils'
import { log } from 'bber-plugins'

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
  contents: new Buffer('<spine toc="_toc_ncx">{% body %}</spine>'),
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
    const nonLinear = _.linear === false
    const linear = nonLinear ? 'no' : 'yes'
    const fname = fileId(_.fileName)

    if (nonLinear) {
      log.info(`bber-output/opf: Writing non-linear asset [${_.fileName}] to [spine]`)
    }

    return `\n<itemref idref="${fname}_xhtml" linear="${linear}"/>`
  }).join('')

const guideItems = arr =>
  arr.map((_) => {
    let item = ''
    let type
    if ((type = getFrontmatter(_, 'type'))) {
      log.info(`bber-output/opf: Adding landmark [${_.fileName}] as [${type}]`)
      const title = escapeHTML(getFrontmatter(_, 'title'))
      const href = `${encodeURI(_.relativePath)}.xhtml`
      item = `\n<reference type="${type}" title="${title}" href="${href}"/>`
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

  if (!term && !element) {
     // meta element for the cover references the id in the manifest, so we
     // create a case to encode it properly :/
    if (data.term !== 'cover') {
      res.push(`<meta name="${data.term}" content="${data.value}"/>`)
    } else {
      res.push(`<meta name="${data.term}" content="${fileId(data.value)}"/>`)
    }
  }
  return res.join('')
}

export { opfPackage, opfMetadata, opfManifest, opfSpine, opfGuide,
  manifestItem, spineItems, guideItems, metatag }
