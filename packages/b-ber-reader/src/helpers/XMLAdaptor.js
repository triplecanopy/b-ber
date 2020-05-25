import xmljs from 'xml-js'
import has from 'lodash/has'
import { Parser as HtmlToReactParser } from 'html-to-react'
import find from 'lodash/find'
import csstree, { List } from 'css-tree'
import { Url, Request, Cache } from '.'
import { BookMetadata, SpineItem, GuideItem } from '../models'
import { processingInstructions, isValidNode } from '../lib/process-nodes'
import DocumentProcessor from '../lib/DocumentProcessor'

class XMLAdaptor {
  static opfURL(url) {
    let url_ = url
    url_ = Url.stripTrailingSlash(url_)
    url_ += '/OPS'
    url_ += '/content.opf'

    url_ = window.encodeURI(url_)
    return url_
  }

  static opsURL(url) {
    let url_ = url
    url_ = Url.stripTrailingSlash(url_)
    url_ += '/OPS'

    url_ = window.encodeURI(url_)
    return url_
  }

  static parseOPF(xml) {
    return new Promise(resolve => {
      const pkg = JSON.parse(xmljs.xml2json(xml.data))
      const { elements } = pkg.elements[0]
      const response = {}

      for (let i = 0; i < elements.length; i++) {
        response[`__${elements[i].name}`] = elements[i]
      }

      resolve(response)
    })
  }

  static parseNCX(rootNode, opsURL) {
    const { __manifest, __spine } = rootNode
    const __ncx = null
    return new Promise(resolve => {
      const { toc } = __spine.attributes
      if (!toc) return resolve({ ...rootNode, __ncx })

      const item = find(__manifest.elements, a => a.attributes.id === toc)
      if (!item) return resolve({ ...rootNode, __ncx })

      const { href } = item.attributes
      Request.get(Url.resolveRelativeURL(opsURL, href)).then(({ data }) => {
        resolve({
          ...rootNode,
          __ncx: JSON.parse(xmljs.xml2json(data)),
        })
      })
    })
  }

  static createSpineItems(rootNode) {
    const { __manifest, __spine, __ncx } = rootNode
    return new Promise(resolve => {
      let spine

      spine = __spine.elements.map(itemref => {
        const { idref, linear } = itemref.attributes
        const item = find(__manifest.elements, a => a.attributes.id === idref)
        if (!item || linear !== 'yes') return null // spine item not found in manifest (!) or non-linear

        const { id, href } = item.attributes
        const mediaType = item.attributes['media-type']
        const properties = item.attributes.properties
          ? item.attributes.properties.split(' ')
          : []
        const spineItem = new SpineItem({
          id,
          href,
          mediaType,
          properties,
          idref,
          linear,
        })
        return spineItem
      })

      spine = spine.filter(Boolean) // remove non-linear and invalid entries

      if (__ncx) {
        const { elements } = __ncx.elements[0]
        const navMap = find(elements, { name: 'navMap' })
        navMap.elements.forEach(navPoint =>
          XMLAdaptor.parseNavPoints(spine, __manifest, navPoint)
        )
      }

      resolve({ ...rootNode, spine })
    })
  }

  static createGuideItems(rootNode) {
    const { __guide } = rootNode
    return new Promise(resolve => {
      if (!__guide.elements || !__guide.elements.length) {
        return resolve({ ...rootNode, guide: [] })
      }

      const guide = __guide.elements.map(reference => {
        const { type, title, href } = reference.attributes
        return new GuideItem({ type, title, href })
      })

      resolve({ ...rootNode, guide })
    })
  }

  static udpateSpineItemURLs(rootNode, opsURL) {
    return new Promise(resolve => {
      const { spine } = rootNode
      spine.map(
        // eslint-disable-next-line no-param-reassign
        a => (a.absoluteURL = Url.resolveRelativeURL(opsURL, a.href))
      )
      resolve({ ...rootNode, spine })
    })
  }

  static udpateGuideItemURLs(rootNode, opsURL) {
    return new Promise(resolve => {
      const { guide } = rootNode
      guide.map(
        // eslint-disable-next-line no-param-reassign
        a => (a.absoluteURL = Url.resolveRelativeURL(opsURL, a.href))
      )
      resolve({ ...rootNode, guide })
    })
  }

  static parseNavPoints(spine, manifest, navPoint, depth = 0, parent = null) {
    const content = find(navPoint.elements, { name: 'content' })
    if (!content) return

    let { src } = content.attributes
    src = Url.ensureDecodedURL(src)
    const item = find(
      manifest.elements,
      a => Url.ensureDecodedURL(a.attributes.href) === src
    )
    if (!item) return console.error(`Could not find manifest item: ${src}`)

    const { id } = item.attributes
    const spineItem = find(spine, { id })
    if (!spineItem) return console.error(`Can not find spine item: ${id}`)

    const navLabel = find(navPoint.elements, { name: 'navLabel' })
    const text = find(navLabel.elements, { name: 'text' })
    const title = find(text.elements, { type: 'text' }).text
    const slug = Url.slug(title)

    spineItem.set('title', title)
    spineItem.set('slug', slug)
    spineItem.set('depth', depth)
    spineItem.set('inTOC', true)

    if (parent) parent.addChild(spineItem)

    const depth_ = depth + 1
    navPoint.elements.forEach(child =>
      XMLAdaptor.parseNavPoints(spine, manifest, child, depth_, spineItem)
    )
  }

  static createBookMetadata(rootNode) {
    const { __metadata } = rootNode
    const _metadata = __metadata.elements
      .filter(a => /^dc:/.test(a.name))
      .map(b => ({ [b.name.slice(3)]: b.elements[0].text }))

    return new Promise(resolve => {
      const metadata = new BookMetadata({})
      _metadata.forEach((item, i) => {
        const key = Object.keys(_metadata[i])
        if (has(metadata, key)) {
          metadata.set(key, item[key])
        }
      })

      resolve({ ...rootNode, metadata })
    })
  }

  static createScopedCSS(sheets, scope, opsURL) {
    let scopedCSS = ''

    sheets.forEach(({ base, data }) => {
      const styleSheetURL = Url.resolveRelativeURL(opsURL, base)
      const tree = csstree.parse(data)

      csstree.walk(tree, {
        enter: (node, item, list) => {
          let value
          let nodeText

          const scopedClassName = List.createItem({
            name: scope,
            type: 'ClassSelector',
          })

          const whiteSpace = List.createItem({
            type: 'WhiteSpace',
            value: ' ',
          })

          // these need to be synced with the
          // HTML structure in Layout.jsx
          if (list && node.type === 'TypeSelector' && node.name === 'html') {
            node.name = scope // eslint-disable-line no-param-reassign
            node.type = 'ClassSelector' // eslint-disable-line no-param-reassign
          }

          if (list && node.type === 'TypeSelector' && node.name === 'body') {
            node.name = 'content' // eslint-disable-line no-param-reassign
            node.type = 'IdSelector' // eslint-disable-line no-param-reassign
          }

          if (
            list &&
            node.name !== scope &&
            list.head.data.name !== scope &&
            (node.type === 'TypeSelector' ||
              node.type === 'IdSelector' ||
              node.type === 'ClassSelector' ||
              node.type === 'AttributeSelector')
          ) {
            list.prepend(whiteSpace)
            list.prepend(scopedClassName)
          }

          if (node.type === 'Url') {
            ;({ value } = node)
            nodeText = value.value

            if (value.type !== 'Raw') {
              nodeText = nodeText.substr(1, nodeText.length - 2) // trim quotes
            }

            if (Url.isRelative(nodeText)) {
              nodeText = Url.resolveRelativeURL(styleSheetURL, nodeText)
              node.value.value = `"${nodeText}"` // eslint-disable-line no-param-reassign
            }
          }
        },
      })

      scopedCSS += csstree.generate(tree)
    })

    return scopedCSS
  }

  static async parseSpineItemResponse(response) {
    const { responseURL } = response.request
    const {
      hash,
      opsURL,
      paddingLeft,
      columnGap,
      cache: useLocalStorageCache,
    } = response

    const htmlToReactParser = new HtmlToReactParser()
    const documentProcessor = new DocumentProcessor({
      paddingLeft,
      columnGap,
      responseURL,
    })

    const { xml, doc } = documentProcessor.parseXML(response.data)
    const re = /<body[^>]*?>([\s\S]*)<\/body>/

    // Create react element that will be appended to our #frame element.
    // we wrap this in a Promise so that we can resolve the content and
    // styles at the same time
    let data_
    data_ = xml.match(re)
    data_ = data_[1] // eslint-disable-line prefer-destructuring
    data_ = data_.replace(/>\s*?</g, '><')

    const bookContent = htmlToReactParser.parseWithInstructions(
      data_,
      isValidNode,
      processingInstructions(response)
    )

    // Scope stylesheets and any inline styles and pass them along to be
    // appended to the DOM as well
    const links = Array.from(doc.querySelectorAll('link'))
    const inlineStyles = Array.from(doc.querySelectorAll('style'))

    const styles = links.reduce((acc, curr) => {
      if (curr.rel !== 'stylesheet') return acc

      const base = Url.trimFilenameFromResponse(responseURL)
      const href = Url.trimSlashes(curr.getAttribute('href'))
      const url = Url.resolveRelativeURL(base, href)

      return acc.concat({ url, base })
    }, [])

    const promises = styles.map(
      ({ url, base }) =>
        new Promise(resolve1 => {
          const cache = Cache.get(url)

          if (useLocalStorageCache && cache?.data) {
            return resolve1({ base, data: cache.data })
          }

          return Request.get(url).then(response1 => {
            if (useLocalStorageCache) Cache.set(url, response1.data)
            return resolve1({ base, data: response1.data })
          })
        })
    )

    let sheets = await Promise.all(promises)

    // Remove inline style elements while extracting their contents to add to
    // the chapter stylesheet
    sheets = inlineStyles.reduce((acc, node) => {
      const { textContent: data } = node

      if (!data) return acc

      const base = Url.trimFilenameFromResponse(responseURL)
      return acc.concat({ base, data })
    }, sheets)

    const hashedClassName = `_${hash}`
    const scopedCSS = XMLAdaptor.createScopedCSS(
      sheets,
      hashedClassName,
      opsURL
    )

    return { bookContent, scopedCSS }
  }
}

export default XMLAdaptor
