/* eslint-disable lines-between-class-members */
/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */

import isUndefined from 'lodash/isUndefined'
import DocumentPreProcessor from './DocumentPreProcessor'
import { rand } from '../helpers/utils'

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

  constructor(options = {}) {
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

  classListContainsAll(node, classNames) {
    return classNames.some(list =>
      list.every(name => node.classList.contains(name))
    )
  }

  classListContainsAny = (node, classNames) =>
    classNames.some(name => node.classList.contains(name))

  classListContainsNone(node, classNames) {
    return classNames.every(list =>
      list.every(name => !node.classList.contains(name))
    )
  }

  shouldParse(node) {
    return (
      node.nodeType === 1 && // Is an element
      this.blackListedNodes.names.has(node.nodeName.toUpperCase()) === false && // Not blacklisted
      node.classList.contains(this.markerClassNames) === false && // Not a marker
      this.classListContainsNone(node, this.blacklistedClassNames)
    )
  }

  isFullbleed(node) {
    return this.classListContainsAll(node, this.fullbleedClassNames)
  }

  isMarker(node) {
    return this.classListContainsAll(node, [[this.markerClassNames]])
  }

  isMarkerReferenceNode(node) {
    return (
      this.classListContainsAny(node, ['spread__content']) ||
      node.nodeName === 'FIGURE'
    )
  }

  hasChildren(node) {
    return node && node.children && node.children.length
  }

  getLastChild(children) {
    let node = null

    for (let i = children.length - 1; i >= 0; i--) {
      // Start at bottom
      node = children[i]
      if (!this.shouldParse(node)) {
        continue // eslint-disable-line no-continue
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

  getSibling(node) {
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

  setMarkerStyles(elem) {
    Object.entries(this.markerStyles).forEach(
      ([key, val]) => (elem.style[key] = val) // eslint-disable-line no-param-reassign
    )
  }

  createMarker(id) {
    const text = document.createTextNode('')
    const elem = document.createElement(this.markerElement)

    elem.setAttribute('class', this.markerClassNames)
    elem.setAttribute('data-marker', id)
    elem.setAttribute('data-unbound', false)
    elem.setAttribute('data-final', false)

    elem.appendChild(text)
    this.setMarkerStyles(elem)

    return elem
  }

  createMarkerId() {
    return rand()
  }

  addMarkerReferenceToChild(node, markerId) {
    for (let i = 0; i < node.children.length; i++) {
      if (this.isMarkerReferenceNode(node.children[i])) {
        node.children[i].setAttribute('data-marker-reference-figure', markerId)
      }
    }
  }

  insertMarkers(doc, callback) {
    // Filter nodes that have been dynamically inserted into the DOM
    const nodes = Array.from(doc.children).filter(node => !this.isMarker(node))

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
              marker.setAttribute('data-adjacent', true)
            }

            // Inject into tree
            sibling.appendChild(marker)
            node.setAttribute('data-marker-reference', markerId)
            node.classList.add('figure__processed')
            this.addMarkerReferenceToChild(node, markerId)
          } else {
            const elem = this.createMarker(markerId)

            elem.setAttribute('data-unbound', true)

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

  isElementNode(node) {
    return node.nodeType === window.Node.ELEMENT_NODE
  }

  removeBottomSpacing(node) {
    node.style.marginBottom = '0'
    node.style.paddingBottom = '0'
  }

  addLastNode(doc) {
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

    let child
    let lastChild

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

  addIndicesToMarkers(doc) {
    const markers = doc.querySelectorAll('[data-marker]')
    const len = markers.length

    for (let i = 0; i < len; i++) {
      markers[i].setAttribute('data-index', i)
      markers[i].setAttribute('data-final', i === len - 1)
    }
  }

  // The `break-after` class should not exist on elements
  // preceeding a spread
  removeBreakAfterClasses(doc) {
    const nodes = Array.from(doc.children).filter(
      node => !this.isMarker(node) && node.nodeType === 1
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
  validateDocument(doc) {
    const markers = doc.querySelectorAll('[data-marker]')
    const refs = doc.querySelectorAll('[data-marker-reference]')
    const refs_ = Array.prototype.slice.call(refs, 0)
    const refHash = {}

    let validLength = true
    let validMarkers = true
    let validRefs = true

    validLength = markers.length === refs.length
    console.assert(validLength, 'Incorrect number of markers')

    for (let i = 0; i < refs_.length; i++) {
      refHash[refs_[i].dataset.markerReference] = true
    }

    for (let j = 0; j < markers.length; j++) {
      const markerId = markers[j].dataset.marker
      const markerData = !isUndefined(markerId)
      console.assert(markerData, `Marker ${j} does not have a marker attribute`)

      const refExists = refHash[markerId]
      console.assert(
        refExists,
        `Reference for marker ${j} (${markerId}) could not be found`
      )

      if (!markerData) validMarkers = false
      if (!refExists) validRefs = false
    }

    return validLength && validMarkers && validRefs
  }

  parseXML(xmlString, callback) {
    const parser = new window.DOMParser()
    const doc = parser.parseFromString(xmlString, 'text/html')

    let xml
    let err = null

    DocumentPreProcessor.setContextDocument(doc)
    DocumentPreProcessor.createStyleSheets()
    DocumentPreProcessor.createScriptElements()
    DocumentPreProcessor.parseXML()

    this.insertMarkers(doc, result => {
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
