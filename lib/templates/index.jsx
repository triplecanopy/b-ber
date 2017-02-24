
/* eslint-disable max-len, operator-linebreak */

import File from 'vinyl'
import mime from 'mime-types'
import YAML from 'yamljs'
import path from 'path'
import { find } from 'lodash'

import conf from '../config'
import Props from '../modules/props'
import { fileid, guid, getFrontmatter, getImageOrientation } from '../utils'

const settings = () => {
  const meta = path.join(__dirname, `../${conf.src}`, 'metadata.yml')
  try {
    if (meta) {
      return YAML.load(meta)
    }
  }
  catch (e) {
    return {}
  }

  return false
}

function getMeta(key) {
  const res = find(settings(), { term: key })
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

const imageTemplates = {
  epub: {
    portrait(data) {
      return `<section epub:type="loi" title="LIST OF ILLUSTRATIONS" class="chapter figures">
        <div class="figure-lg">
          <figure id="${data.id}">
            <div class="img-wrap" style="width: 70%; margin: 0 auto;">
              <a href="${data.ref}.xhtml#ref${data.id}">
                <img class="portrait" alt="${data.alt}" src="../images/${data.url}" style="width: 100%; max-width: 100%; height: auto;"/>
              </a>
              <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
                <p class="small">${data.caption || ''}</p>
              </div>
            </div>
          </figure>
        </div>
      </section>`
    },
    landscape(data) {
      return `<section epub:type="loi" title="LIST OF ILLUSTRATIONS" class="chapter figures">
        <div class="figure-lg">
          <figure id="${data.id}">
            <div class="img-wrap">
              <a href="${data.ref}.xhtml#ref${data.id}">
                <img class="landscape" alt="${data.alt}" src="../images/${data.url}" style="max-width: 100%;"/>
              </a>
              <div class="figcaption" style="max-width: 100%;">
                <p class="small">${data.caption || ''}</p>
              </div>
            </div>
          </figure>
        </div>
      </section>`
    },
    portraitLong(data) {
      return `<section epub:type="loi" title="LIST OF ILLUSTRATIONS" class="chapter figures">
        <div class="figure-lg">
          <figure id="${data.id}">
            <div class="img-wrap" style="width: 60%; margin: 0 auto;">
              <a href="${data.ref}.xhtml#ref${data.id}">
                <img class="portrait-long" alt="${data.alt}" src="../images/${data.url}" style="width: 100%; max-width: 100%; height: auto;"/>
              </a>
              <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
                <p class="small">${data.caption || ''}</p>
              </div>
            </div>
          </figure>
        </div>
      </section>`
    },
    square(data) {
      return `<section epub:type="loi" title="LIST OF ILLUSTRATIONS" class="chapter figures">
        <div class="figure-lg">
          <figure id="${data.id}">
            <div class="img-wrap" style="width: 85%; margin: 0 auto;">
              <a href="${data.ref}.xhtml#ref${data.id}">
                <img class="square" alt="${data.alt}" src="../images/${data.url}" style="width: 100%; max-width: 100%; height: auto;"/>
              </a>
              <div class="figcaption" style="width: 100%; max-width: 100%; height: auto;">
                <p class="small">${data.caption || ''}</p>
              </div>
            </div>
          </figure>
        </div>
      </section>`
    }
  }
}

function figure(data, env) {
  const { width, height } = data
  const format = getImageOrientation(width, height)
  return imageTemplates[env || 'epub'][format](data)
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

const ncxHead = () =>
  `<head>
    <meta name="dtb:uid" content="${getMeta('identifier')}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="1"/>
    <meta name="dtb:maxPageNumber" content="1"/>
  </head>`

const ncxTitle = () =>
  `<docTitle>
    <text>${getMeta('title')}</text>
  </docTitle>`

const ncxAuthor = () =>
  `<docAuthor>
    <text>${getMeta('creator')}</text>
  </docAuthor>`

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

const tocitem = (list) => {
  function render(arr) {
    let res = String('')
    res += '<ol>'
    arr.forEach((entry) => {
      res += '<li>'
      res += `<a href="text/${entry.filename}">`
      res += entry.title
      res += '</a>'
      if (entry.children.length) { res += render(entry.children) }
      res += '</li>'
    })
    res += '</ol>'
    return res
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
