import generate from 'css-tree/generator'
import parse from 'css-tree/parser'
import * as utils from 'css-tree/utils'
import walk from 'css-tree/walker'
import { Parser as HtmlToReactParser } from 'html-to-react'
import find from 'lodash/find'
import has from 'lodash/has'
import xmljs from 'xml-js'
import DocumentProcessor from '../lib/DocumentProcessor'
import { isValidNode, processingInstructions } from '../lib/process-nodes'
// import Cache from './Cache'
import { BookMetadata, GuideItem, SpineItem } from '../models'
import * as Request from './Request'
import Url from './Url'

// The parsed OPF/NCX trees are walked dynamically (xml-js / css-tree output),
// so the node shapes here are intentionally loose. TODO: type the OPF/NCX
// structures once a schema exists.
type AnyNode = any
type RootNode = any

class XMLAdaptor {
  static opfURL(url: string): string {
    let url_ = url

    url_ = Url.stripTrailingSlash(url_)
    url_ += '/OPS' // epub.version === '2' ? 'OEBPS' : 'OPS';
    url_ += '/content.opf'

    url_ = window.encodeURI(url_)
    return url_
  }

  static opsURL(url: string): string {
    let url_ = url

    url_ = Url.stripTrailingSlash(url_)
    url_ += '/OPS'

    url_ = window.encodeURI(url_)
    return url_
  }

  static parseOPF(xml: { data: string }): Promise<RootNode> {
    return new Promise((resolve) => {
      const pkg = JSON.parse(xmljs.xml2json(xml.data))
      const { elements } = pkg.elements[0]
      const response: Record<string, AnyNode> = {}

      for (let i = 0; i < elements.length; i++) {
        response[`__${elements[i].name}`] = elements[i]
      }

      resolve(response)
    })
  }

  static parseNCX(rootNode: RootNode, opsURL: string): Promise<RootNode> {
    const { __manifest, __spine } = rootNode
    const __ncx = null
    return new Promise((resolve) => {
      const { toc } = __spine.attributes
      if (!toc) {
        resolve({ ...rootNode, __ncx })
        return
      }

      const item = find(
        __manifest.elements,
        (a: AnyNode) => a.attributes.id === toc
      )
      if (!item) {
        resolve({ ...rootNode, __ncx })
        return
      }

      const { href } = item.attributes
      Request.getText(Url.resolveRelativeURL(opsURL, href)).then(({ data }) => {
        resolve({
          ...rootNode,
          __ncx: JSON.parse(xmljs.xml2json(data)),
        })
      })
    })
  }

  static createSpineItems(rootNode: RootNode): Promise<RootNode> {
    const { __manifest, __spine, __ncx, __guide } = rootNode

    return new Promise((resolve) => {
      let spine

      spine = __spine.elements.map((itemref: AnyNode) => {
        const { idref, linear } = itemref.attributes
        const item = find(
          __manifest.elements,
          (a: AnyNode) => a.attributes.id === idref
        )

        if (!item || linear !== 'yes') return null // spine item not found in manifest (!) or non-linear

        const { id, href } = item.attributes
        const mediaType = item.attributes['media-type']
        const properties = item.attributes.properties
          ? item.attributes.properties.split(' ')
          : []

        // TODO the `guide` element should have more information if possible, to match
        // or exceed the data in the NCX so that we only have to parse one XML structure.
        // Currently this is just being used to add the `title` and `slug` attributes
        // that are missing from items excluded from the TOC, and therefore not in the NCX
        const guideItem = find(
          __guide.elements,
          (a: AnyNode) => a.attributes.href === href
        )

        let title = ''
        let slug = ''

        if (guideItem) {
          ;({ title } = guideItem.attributes)
          slug = Url.slug(title)
        }

        const spineItem = new SpineItem({
          id,
          href,
          mediaType,
          properties,
          idref,
          linear,
          title,
          slug,
        })

        return spineItem
      })

      spine = spine.filter(Boolean) // remove non-linear and invalid entries

      // Get info about each spine item, e.g., the title, if it's nested, etc
      if (__ncx) {
        const { elements } = __ncx.elements[0]
        const navMap = find(elements, { name: 'navMap' })
        navMap.elements.forEach((navPoint: AnyNode) => {
          XMLAdaptor.parseNavPoints(spine, __manifest, navPoint)
        })
      }

      resolve({ ...rootNode, spine })
    })
  }

  static createGuideItems(rootNode: RootNode): Promise<RootNode> {
    const { __guide } = rootNode
    return new Promise((resolve) => {
      if (!__guide.elements || !__guide.elements.length) {
        resolve({ ...rootNode, guide: [] })
        return
      }

      const guide = __guide.elements.map((reference: AnyNode) => {
        const { type, title, href } = reference.attributes
        return new GuideItem({ type, title, href })
      })

      resolve({ ...rootNode, guide })
    })
  }

  static udpateSpineItemURLs(
    rootNode: RootNode,
    opsURL: string
  ): Promise<RootNode> {
    return new Promise((resolve) => {
      const { spine } = rootNode
      spine.map(
        (a: SpineItem) =>
          (a.absoluteURL = Url.resolveRelativeURL(opsURL, a.href))
      )
      resolve({ ...rootNode, spine })
    })
  }

  static udpateGuideItemURLs(
    rootNode: RootNode,
    opsURL: string
  ): Promise<RootNode> {
    return new Promise((resolve) => {
      const { guide } = rootNode
      guide.map(
        (a: GuideItem) =>
          (a.absoluteURL = Url.resolveRelativeURL(opsURL, a.href))
      )
      resolve({ ...rootNode, guide })
    })
  }

  static parseNavPoints(
    spine: SpineItem[],
    manifest: AnyNode,
    navPoint: AnyNode,
    depth = 0,
    parent: SpineItem | null = null
  ): void | undefined {
    const content = find(navPoint.elements, { name: 'content' })
    if (!content) return

    let { src } = content.attributes
    src = Url.ensureDecodedURL(src)
    const item = find(
      manifest.elements,
      (a: AnyNode) => Url.ensureDecodedURL(a.attributes.href) === src
    )
    if (!item) return console.error(`Could not find manifest item: ${src}`)

    const { id } = item.attributes
    const spineItem = find(spine, { id })
    if (!spineItem) return console.error(`Can not find spine item: ${id}`)

    const navLabel = find(navPoint.elements, { name: 'navLabel' })
    const text = find(navLabel.elements, { name: 'text' })
    const title = find(text.elements, { type: 'text' }).text
    const slug = Url.slug(title)

    if (!spineItem.title) spineItem.set('title', title)
    if (!spineItem.slug) spineItem.set('slug', slug)

    spineItem.set('depth', depth)
    spineItem.set('inTOC', true)

    if (parent) parent.addChild(spineItem)

    const depth_ = depth + 1
    navPoint.elements.forEach((child: AnyNode) => {
      XMLAdaptor.parseNavPoints(spine, manifest, child, depth_, spineItem)
    })
  }

  static createBookMetadata(rootNode: RootNode): Promise<RootNode> {
    const { __metadata } = rootNode
    const _metadata = __metadata.elements
      .filter((a: AnyNode) => /^dc:/.test(a.name))
      .map((b: AnyNode) => ({ [b.name.slice(3)]: b.elements[0].text }))

    return new Promise((resolve) => {
      // The original seeds an empty BookMetadata and fills it via `set`; the
      // constructor type expects all Dublin Core fields. TODO: type this.
      const metadata = new BookMetadata({} as any)
      _metadata.forEach((item: Record<string, string>, i: number) => {
        // `key` is the single-entry key array Object.keys returns; lodash `has`
        // and the original `set` call both accept it as-is.
        const key = Object.keys(_metadata[i])
        if (has(metadata, key)) {
          metadata.set(key as any, item[key as any])
        }
      })

      resolve({ ...rootNode, metadata })
    })
  }

  static createScopedCSS(
    sheets: { base: string; data: string }[],
    scope: string,
    opsURL: string
  ): string {
    let scopedCSS = ''

    sheets.forEach(({ base, data }) => {
      const styleSheetURL = Url.resolveRelativeURL(opsURL, base)
      const tree = parse(data)

      walk(tree, {
        enter: (node: AnyNode, _item: AnyNode, list: AnyNode) => {
          let nodeText

          const scopedClassName = utils.List.createItem({
            name: scope,
            type: 'ClassSelector',
          })

          const whiteSpace = utils.List.createItem({
            type: 'WhiteSpace',
            value: ' ',
          })

          // these need to be synced with the
          // HTML structure in Layout.jsx
          if (list && node.type === 'TypeSelector' && node.name === 'html') {
            node.name = scope
            node.type = 'ClassSelector'
          }

          if (list && node.type === 'TypeSelector' && node.name === 'body') {
            node.name = 'content'
            node.type = 'IdSelector'
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
            nodeText = node.value.replace(/(?:^['"]+|['"]+$)/g, '')

            if (Url.isRelative(nodeText)) {
              nodeText = Url.resolveRelativeURL(styleSheetURL, nodeText)
              // node.value = `"${nodeText}"`
              node.value = nodeText
            }
          }
        },
      })

      scopedCSS += generate(tree)
    })

    return scopedCSS
  }

  static async parseSpineItemResponse(
    response: AnyNode
  ): Promise<{ bookContent: React.ReactNode; scopedCSS: string }> {
    const { url: responseURL } = response.request

    const {
      hash,
      opsURL,
      paddingLeft,
      columnGap,
      // cache: useLocalStorageCache,
    } = response

    const htmlToReactParser = new HtmlToReactParser()
    // paddingLeft/columnGap are extra fields the processor ignores but the
    // original call passed; DocumentProcessorOptions doesn't list them.
    // TODO: drop these args or widen DocumentProcessorOptions.
    const documentProcessor = new DocumentProcessor({
      paddingLeft,
      columnGap,
      responseURL,
    } as any)

    const { xml, doc } = documentProcessor.parseXML(response.data) as {
      xml: string
      doc: Document
    }
    const re = /<body[^>]*?>([\s\S]*)<\/body>/

    // Create react element that will be appended to our #frame element.
    // we wrap this in a Promise so that we can resolve the content and
    // styles at the same time
    let data_
    data_ = xml.match(re) as RegExpMatchArray
    data_ = data_[1]
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

    const styles = links.reduce(
      (acc: { url: string; base: string }[], curr) => {
        if (curr.rel !== 'stylesheet') return acc

        const base = Url.trimFilenameFromResponse(responseURL)
        const href = Url.trimSlashes(curr.getAttribute('href') as string)
        const url = Url.resolveRelativeURL(base, href)

        return acc.concat({ url, base })
      },
      []
    )

    const promises = styles.map(
      ({ url, base }) =>
        new Promise<{ base: string; data: string }>((rs) => {
          // const cache = Cache.get(url)

          // if (useLocalStorageCache && cache?.data) {
          //   console.log('Loads CSS from cache %s', url)
          //   rs({ base, data: cache.data })
          //   return
          // }

          Request.getText(url).then((rsp) => {
            // if (useLocalStorageCache) {
            //   console.log('No CSS cache - setting cache for %s', url)
            //   Cache.set(url, rsp.data)
            // }

            rs({ base, data: rsp.data })
          })
        })
    )

    const linkedSheets = await Promise.all(promises)

    // Remove inline style elements while extracting their contents to add to
    // the chapter stylesheet
    const sheets = inlineStyles.reduce((acc, node) => {
      const { textContent: data } = node

      if (!data) return acc

      const base = Url.trimFilenameFromResponse(responseURL)
      return acc.concat({ base, data })
    }, linkedSheets)

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
