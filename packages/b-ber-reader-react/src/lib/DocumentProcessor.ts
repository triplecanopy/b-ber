import isUndefined from 'lodash/isUndefined'
import { rand } from '../helpers/utils'
import DocumentPreProcessor from './DocumentPreProcessor'

interface DocumentProcessorOptions {
  fullbleedClassNames?: string[][]
  blacklistedClassNames?: string[][]
  markerClassNames?: string
  markerElement?: string
  responseURL?: string
}

interface ParseResult {
  xml: string | undefined
  doc: Document
}

class DocumentProcessor {
  static defaults = {
    fullbleedClassNames: [
      ['figure__inline', 'figure__large', 'figure__fullbleed'],
      ['spread'],
    ],
    blacklistedClassNames: [
      ['gallery__item', 'figure__items', 'figure__processed'],
      ['pullquote'],
      ['initial'],
    ],
    markerClassNames: 'marker',
    markerElement: 'span',
    responseURL: window.location.host,
  }

  settings: Required<DocumentProcessorOptions>
  fullbleedClassNames: string[][]
  blacklistedClassNames: string[][]
  markerClassNames: string
  markerElement: string
  markerStyles: Record<string, string | number>
  blackListedNodes: { names: Set<string> }

  constructor(options: DocumentProcessorOptions = {}) {
    // Initialize
    if (!DocumentPreProcessor.getRootDocument()) {
      DocumentPreProcessor.setRootDocument(document)
    }

    // Cleanup
    DocumentPreProcessor.removeStyleSheets()
    DocumentPreProcessor.removeScripts()

    // Settings
    this.settings = { ...DocumentProcessor.defaults, ...options }

    DocumentPreProcessor.setRequestURI(this.settings.responseURL)

    this.fullbleedClassNames = this.settings.fullbleedClassNames
    this.blacklistedClassNames = this.settings.blacklistedClassNames
    this.markerClassNames = this.settings.markerClassNames
    this.markerElement = this.settings.markerElement

    this.markerStyles = {
      display: 'block',
      height: '1px',
      position: 'relative',
      top: 0,
      left: 0,
      width: '100%',
      // fontSize: 0,
      lineHeight: 0,
      textindent: 0,
      margin: 0,
      padding: 0,
    }

    this.blackListedNodes = {
      names: new Set([
        'META',
        'TITLE',
        'HEAD',
        'LINK',
        'SCRIPT',
        'STYLE',
        'A',
        'EM',
        'I',
        'STRONG',
        'B',
        'SPAN',
        'IMG',
        'AUDIO',
        'VIDEO',
        'BR',
        'SUP',
        'SUB',
        'IFRAME',
        'FIGURE',
        'CITE',
        'BLOCKQUOTE',
        'LI',
      ]),
    }
  }

  classListContainsAll(node: Element, classNames: string[][]): boolean {
    return classNames.some((list) =>
      list.every((name) => node.classList.contains(name))
    )
  }

  classListContainsAny = (node: Element, classNames: string[]): boolean =>
    classNames.some((name) => node.classList.contains(name))

  classListContainsNone(node: Element, classNames: string[][]): boolean {
    return classNames.every((list) =>
      list.every((name) => !node.classList.contains(name))
    )
  }

  shouldParse(node: Element): boolean {
    return (
      node.nodeType === 1 && // Is an element
      this.blackListedNodes.names.has(node.nodeName.toUpperCase()) === false && // Not blacklisted
      node.classList.contains(this.markerClassNames) === false && // Not a marker
      this.classListContainsNone(node, this.blacklistedClassNames)
    )
  }

  isFullbleed(node: Element): boolean {
    return this.classListContainsAll(node, this.fullbleedClassNames)
  }

  isMarker(node: Element): boolean {
    return this.classListContainsAll(node, [[this.markerClassNames]])
  }

  isMarkerReferenceNode(node: Element): boolean {
    return (
      this.classListContainsAny(node, ['spread__content']) ||
      node.nodeName === 'FIGURE'
    )
  }

  hasChildren(node: Element): boolean {
    return Boolean(node && node.children && node.children.length)
  }

  // DOM-walking helpers below operate on live parsed nodes whose shapes mix
  // Element/Node and rely on non-standard coercions (e.g. setAttribute with
  // booleans). Typed loosely to preserve exact runtime behavior.
  // TODO: type this against a narrowed DOM node model
  getLastChild(children: any): any {
    let node = null

    for (let i = children.length - 1; i >= 0; i--) {
      // Start at bottom
      node = children[i]
      if (!this.shouldParse(node)) {
        continue
      }

      if (this.hasChildren(node)) {
        return this.getLastChild(node.children)
      }

      // Exit early since this is the last node in the collection
      return node
    }

    // Fallback to parent in case no children could be parsed
    return children[children.length - 1].parentNode
  }

  getSibling(node: any): any {
    if (node === null) return node

    const { previousElementSibling } = node

    // Top of document
    if (!previousElementSibling) {
      return this.getSibling(node.parentNode)
    }

    // If the sibling is another target, it can't be parsed, and can't be appended
    // to since it's going to be absolutely positioned, so return sibling
    if (this.isFullbleed(previousElementSibling)) {
      return this.getSibling(previousElementSibling)
    }

    // Not a target, not parseable, get siblings
    if (!this.shouldParse(previousElementSibling)) {
      return this.getSibling(previousElementSibling)
    }

    // No children, append to previousElementSibling
    if (!this.hasChildren(previousElementSibling)) {
      return previousElementSibling
    }

    // Node can be parsed, find the last child and append marker
    const lastChild = this.getLastChild(previousElementSibling.children)
    return lastChild
  }

  setMarkerStyles(elem: any): void {
    Object.entries(this.markerStyles).forEach(
      ([key, val]) => (elem.style[key] = val)
    )
  }

  createMarker(id: string): HTMLElement {
    const text = document.createTextNode('')
    const elem = document.createElement(this.markerElement)

    elem.setAttribute('class', this.markerClassNames)
    elem.setAttribute('data-marker', id)
    // Original passes booleans to setAttribute; coerced to strings at runtime.
    elem.setAttribute('data-unbound', false as unknown as string)
    elem.setAttribute('data-final', false as unknown as string)

    elem.appendChild(text)
    this.setMarkerStyles(elem)

    return elem
  }

  createMarkerId(): string {
    return rand()
  }

  addMarkerReferenceToChild(node: any, markerId: string): void {
    for (let i = 0; i < node.children.length; i++) {
      if (this.isMarkerReferenceNode(node.children[i])) {
        node.children[i].setAttribute('data-marker-reference-figure', markerId)
      }
    }
  }

  insertMarkers(doc: any, callback?: (doc: any) => void): void {
    // Filter nodes that have been dynamically inserted into the DOM
    const nodes = (Array.from(doc.children) as any[]).filter(
      (node) => !this.isMarker(node)
    )

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      const markerId = this.createMarkerId()

      let sibling

      const shouldParse = this.shouldParse(node)
      const isFullbleed = this.isFullbleed(node)

      if (shouldParse) {
        if (isFullbleed) {
          sibling = this.getSibling(node)

          if (sibling) {
            const marker = this.createMarker(markerId)

            // Check to see if the marker being injected shares a parent with
            // another marker and set a flag if so. This is referenced in
            // Marker.jsx

            if (
              sibling.lastElementChild &&
              this.isMarker(sibling.lastElementChild)
            ) {
              marker.setAttribute('data-adjacent', true as unknown as string)
            }

            // Inject into tree
            sibling.appendChild(marker)
            node.setAttribute('data-marker-reference', markerId)
            node.classList.add('figure__processed')
            this.addMarkerReferenceToChild(node, markerId)
          } else {
            const elem = this.createMarker(markerId)

            elem.setAttribute('data-unbound', true as unknown as string)

            node.parentNode.prepend(elem)
            node.setAttribute('data-marker-reference', markerId)
            node.classList.add('figure__processed')

            this.addMarkerReferenceToChild(node, markerId)
          }
        }

        if (node.children && node.children.length) {
          this.insertMarkers(node)
        }
      }
    }

    if (callback && typeof callback === 'function') {
      callback(doc)
    }
  }

  isElementNode(node: any): boolean {
    return node.nodeType === window.Node.ELEMENT_NODE
  }

  removeBottomSpacing(node: any): void {
    node.style.marginBottom = '0'
    node.style.paddingBottom = '0'
  }

  addLastNode(doc: Document): void {
    const blacklist = new Set([
      'META',
      'TITLE',
      'HEAD',
      'LINK',
      'SCRIPT',
      'STYLE',
      'EM',
      'I',
      'STRONG',
      'B',
      'SPAN',
      'IMG',
      'AUDIO',
      'VIDEO',
      'BR',
      'SUP',
      'SUB',
      'IFRAME',
    ])

    const text = document.createTextNode('')
    const elem = document.createElement('span')

    elem.setAttribute('class', 'ultimate')
    elem.setAttribute('data-ultimate', 'true')
    elem.appendChild(text)

    let child: any
    let lastChild: any

    for (let i = doc.body.childNodes.length - 1; i >= 0; i--) {
      child = doc.body.childNodes[i]

      if (!blacklist.has(child.nodeName) && this.isElementNode(child)) {
        // Remove margin and padding from child, and loop through the child
        // element, removing all of its last-childs' bottom spacing as well.
        // This helps prevent "blank pages" at the end of chapters
        this.removeBottomSpacing(child)

        lastChild = child.lastElementChild
        while (lastChild) {
          // Check against some attributes to ensure we're not breaking the
          // spread layout
          if (!this.isMarkerReferenceNode(lastChild)) {
            this.removeBottomSpacing(lastChild)
          }

          lastChild = lastChild.lastElementChild
        }

        child.appendChild(elem)
        return
      }
    }

    console.warn('Could not append ultimate node')
  }

  addIndicesToMarkers(doc: Document): void {
    const markers = doc.querySelectorAll('[data-marker]')
    const len = markers.length

    for (let i = 0; i < len; i++) {
      // Original passes a number / boolean to setAttribute; coerced at runtime.
      markers[i].setAttribute('data-index', i as unknown as string)
      markers[i].setAttribute(
        'data-final',
        (i === len - 1) as unknown as string
      )
    }
  }

  // The `break-after` class should not exist on elements
  // preceeding a spread
  removeBreakAfterClasses(doc: any): void {
    const nodes = (Array.from(doc.children) as any[]).filter(
      (node) => !this.isMarker(node) && node.nodeType === 1
    )

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      const sibling = node.nextElementSibling

      if (
        node.classList.contains('break-after') &&
        sibling &&
        this.isFullbleed(sibling)
      ) {
        node.classList.remove('break-after')
      }

      if (node.children && node.children.length) {
        this.removeBreakAfterClasses(node)
      }
    }
  }

  // Check that all references have markers
  validateDocument(doc: Document): boolean {
    const markers = doc.querySelectorAll('[data-marker]')
    const refs = doc.querySelectorAll('[data-marker-reference]')
    const refs_ = Array.prototype.slice.call(refs, 0)
    const refHash: Record<string, boolean> = {}

    let validLength = true
    let validMarkers = true
    let validRefs = true

    validLength = markers.length === refs.length
    console.assert(validLength, 'Incorrect number of markers')

    for (let i = 0; i < refs_.length; i++) {
      refHash[refs_[i].dataset.markerReference] = true
    }

    for (let j = 0; j < markers.length; j++) {
      const markerId = (markers[j] as HTMLElement).dataset.marker
      const markerData = !isUndefined(markerId)
      console.assert(markerData, `Marker ${j} does not have a marker attribute`)

      const refExists = refHash[markerId as string]
      console.assert(
        refExists,
        `Reference for marker ${j} (${markerId}) could not be found`
      )

      if (!markerData) validMarkers = false
      if (!refExists) validRefs = false
    }

    return validLength && validMarkers && validRefs
  }

  parseXML(
    xmlString: string,
    callback?: (err: Error | null, result: ParseResult) => unknown
  ): unknown {
    const parser = new window.DOMParser()
    const doc = parser.parseFromString(xmlString, 'text/html')

    let xml: string | undefined
    let err: Error | null = null

    DocumentPreProcessor.setContextDocument(doc)
    DocumentPreProcessor.createStyleSheets()
    DocumentPreProcessor.createScriptElements()
    DocumentPreProcessor.parseXML()

    this.insertMarkers(doc, (result) => {
      if (!this.validateDocument(result)) {
        err = new Error('Invalid markup')
      }

      this.addLastNode(doc)
      this.addIndicesToMarkers(doc)
      this.removeBreakAfterClasses(doc)

      xml = xmlString.replace(
        /<body([^>]*?)>[\s\S]*<\/body>/g,
        (_, match) => `<body${match}>${doc.body.innerHTML}</body>`
      )
    })

    const result = { xml, doc }

    if (callback && typeof callback === 'function') {
      return callback(err, result)
    }

    return result
  }
}

export default DocumentProcessor
