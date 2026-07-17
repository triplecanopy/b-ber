import { elements, terms } from '@canopycanopycanopy/b-ber-shapes-dublin-core'
import fs from 'fs-extra'
import mime from 'mime-types'

interface ManifestFile {
  absolutePath: string
  name: string
}

interface DCMetaEntry {
  term?: string
  [key: string]: unknown
}

// Class to detect XML media-type properties based on the content of XHTML documents
class ManifestItemProperties {
  static HTMLMimeTypes = ['text/html', 'application/xhtml+xml']

  // Detect if a file is an (X)HTML document
  static isHTML(file: ManifestFile): boolean {
    return ManifestItemProperties.HTMLMimeTypes.includes(
      mime.lookup(file.absolutePath) as string
    )
  }

  // Detect if a file is an ePub navigation document
  static isNav(file: ManifestFile): boolean {
    return ManifestItemProperties.isHTML(file) && /^toc\./.test(file.name)
  }

  // Detect if an XHTML file contains JavaScript
  static isScripted(file: ManifestFile): boolean {
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
  static isSVG(file: ManifestFile): boolean {
    if (!ManifestItemProperties.isHTML(file)) return false
    const contents = fs.readFileSync(file.absolutePath, 'utf8')
    return contents.match(/<svg/) !== null
  }

  // Detect if a term is a Dublin Core `element`
  static isDCElement(data: DCMetaEntry): boolean {
    return (
      Object.hasOwn(data, 'term') && elements.indexOf(data.term as string) > -1
    )
  }

  // Detect if a term is a Dublin Core `term`
  static isDCTerm(data: DCMetaEntry): boolean {
    return (
      Object.hasOwn(data, 'term') && terms.indexOf(data.term as string) > -1
    )
  }

  // Detect if an XHTML file contains remote resources
  static hasRemoteResources(file: ManifestFile): boolean {
    if (!ManifestItemProperties.isHTML(file)) return false

    const contents = fs.readFileSync(file.absolutePath, 'utf8')
    return contents.match(/src=(?:['"]{1})?(?:http|\/\/)/) !== null
  }

  // Test if an XHTML file is a navigation document, contains JavaScript or SVG
  static testHTML(file: ManifestFile): string[] {
    const props: string[] = []
    if (ManifestItemProperties.isNav(file)) props.push('nav')
    if (ManifestItemProperties.isScripted(file)) props.push('scripted')
    if (ManifestItemProperties.isSVG(file)) props.push('svg')
    if (ManifestItemProperties.hasRemoteResources(file)) {
      props.push('remote-resources')
    }

    return props
  }

  // Test if an object contains Dublin Core `term`s or `element`s
  static testMeta(data: DCMetaEntry): { term: boolean; element: boolean } {
    return {
      term: ManifestItemProperties.isDCTerm(data),
      element: ManifestItemProperties.isDCElement(data),
    }
  }
}

export default ManifestItemProperties
