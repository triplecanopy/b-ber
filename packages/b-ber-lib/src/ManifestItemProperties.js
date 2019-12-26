import fs from 'fs-extra'
import mime from 'mime-types'
import has from 'lodash/has'
import { terms, elements } from '@canopycanopycanopy/b-ber-shapes-dublin-core'

// Class to detect XML media-type properties based on the content of XHTML documents
class ManifestItemProperties {
  static HTMLMimeTypes = ['text/html', 'application/xhtml+xml']

  // Detect if a file is an (X)HTML document
  static isHTML(file) {
    return ManifestItemProperties.HTMLMimeTypes.includes(
      mime.lookup(file.absolutePath)
    )
  }

  // Detect if a file is an ePub navigation document
  static isNav(file) {
    return ManifestItemProperties.isHTML(file) && /^toc\./.test(file.name)
  }

  // Detect if an XHTML file contains JavaScript
  static isScripted(file) {
    if (!ManifestItemProperties.isHTML(file)) return false

    // TODO: fixme; we need to check if the toc.xhtml is scripted, but it
    // hasn't been written to disk yet.  checking right now against the
    // results from `state.template.dynamicTail` for now, since we know
    // that the toc was written using that
    // @issue: https://github.com/triplecanopy/b-ber/issues/206
    if (ManifestItemProperties.isNav(file)) return true

    const contents = fs.readFileSync(file.absolutePath, 'utf8')
    return contents.match(/<script/) !== null
  }

  // Detect if an XHTML file contains SVG
  static isSVG(file) {
    if (!ManifestItemProperties.isHTML(file)) return false
    const contents = fs.readFileSync(file.absolutePath, 'utf8')
    return contents.match(/<svg/) !== null
  }

  // Detect if a term is a Dublin Core `element`
  static isDCElement(data) {
    return has(data, 'term') && elements.indexOf(data.term) > -1
  }

  // Detect if a term is a Dublin Core `term`
  static isDCTerm(data) {
    return has(data, 'term') && terms.indexOf(data.term) > -1
  }

  // Detect if an XHTML file contains remote resources
  static hasRemoteResources(file) {
    if (!ManifestItemProperties.isHTML(file)) return false

    const contents = fs.readFileSync(file.absolutePath, 'utf8')
    return contents.match(/src=(?:['"]{1})?(?:http|\/\/)/) !== null
  }

  // Test if an XHTML file is a navigation document, contains JavaScript or SVG
  static testHTML(file) {
    const props = []
    if (ManifestItemProperties.isNav(file)) props.push('nav')
    if (ManifestItemProperties.isScripted(file)) props.push('scripted')
    if (ManifestItemProperties.isSVG(file)) props.push('svg')
    if (ManifestItemProperties.hasRemoteResources(file)) {
      props.push('remote-resources')
    }

    return props
  }

  // Test if an object contains Dublin Core `term`s or `element`s
  static testMeta(data) {
    return {
      term: ManifestItemProperties.isDCTerm(data),
      element: ManifestItemProperties.isDCElement(data),
    }
  }
}

export default ManifestItemProperties
