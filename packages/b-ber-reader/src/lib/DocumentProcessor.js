/* eslint-disable class-methods-use-this */
import DocumentPreProcessor from './DocumentPreProcessor'
import { rand } from '../helpers/utils'

class DocumentProcessor {
    static defaults = {
        targetClassNames: [['figure__inline', 'figure__large', 'figure__fullbleed'], ['spread']],
        blacklistedClassNames: [['gallery__item', 'figure__items']],
        markerClassNames: 'marker',
        markerElement: 'span',
        paddingLeft: 0,
        columnGap: 0,
        responseURL: window.location.host,
    }
    constructor(options = {}) {
        // initialize
        if (!DocumentPreProcessor.getRootDocument()) {
            DocumentPreProcessor.setRootDocument(document)
        }

        // cleanup
        DocumentPreProcessor.removeStyleSheets()
        DocumentPreProcessor.removeScripts()

        // settings
        this.settings = { ...DocumentProcessor.defaults, ...options }

        DocumentPreProcessor.setRequestURI(this.settings.responseURL)

        this.targetClassNames = this.settings.targetClassNames
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
            fontSize: 0,
            lineHeight: 0,
            textindent: 0,
            margin: 0,
            padding: 0,
        }

        this.blackListedNodes = {
            names: [
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
                'FIGURE',
            ],
        }
    }

    classListContainsAll(node, classNames) {
        return classNames.some(list => list.every(name => node.classList.contains(name)))
    }

    classListContainsNone(node, classNames) {
        return classNames.some(list => list.every(name => !node.classList.contains(name)))
    }

    shouldParse(node) {
        // prettier-ignore
        return (
            node.nodeType === 1 && // is an element
            this.blackListedNodes.names.indexOf(node.nodeName.toUpperCase()) < 0 && // not blacklisted
            node.classList.contains(this.markerClassNames) !== true && // not a marker
            this.classListContainsNone(node, this.blacklistedClassNames)
        )
    }

    isTarget(node) {
        return this.classListContainsAll(node, this.targetClassNames)
    }

    isMarker(node) {
        return this.classListContainsAll(node, [['marker']])
    }

    hasChildren(node) {
        return node && node.children && node.children.length
    }

    getLastChild(children) {
        let node = null

        for (let i = children.length - 1; i >= 0; i--) {
            // start at bottom
            node = children[i]
            if (!this.shouldParse(node)) continue // eslint-disable-line no-continue

            if (this.hasChildren(node)) {
                return this.getLastChild(node.children)
            }

            // exit early since we're at the last node in the collection
            return node
        }

        // fallback to parent in case we couldn't parse any of the children
        return children[children.length - 1].parentNode
    }

    getSibling(node) {
        if (node === null) return node
        const node_ = node.previousElementSibling
        // top of document
        if (!node_) {
            return this.getSibling(node.parentNode)
        }

        // if the sibling is another target, we don't parse it, and can't append
        // to it since it's going to be absolutely positioned, so return sibling
        if (this.isTarget(node_)) {
            return this.getSibling(node_)
        }

        // not a target, not something we can parse, get siblings
        if (!this.shouldParse(node_)) {
            return this.getSibling(node_)
        }

        // no children, append to node_
        if (!this.hasChildren(node_)) {
            return node_
        }

        // node can be parsed, find the last child and append marker
        const lastChild = this.getLastChild(node_.children)
        return lastChild
    }

    setMarkerStyles(elem) {
        Object.entries(this.markerStyles).forEach(
            ([key, val]) => (elem.style[key] = val), // eslint-disable-line no-param-reassign
        )
    }

    createMarker(id) {
        const text = document.createTextNode('')
        const elem = document.createElement(this.markerElement)

        elem.setAttribute('class', this.markerClassNames)
        elem.setAttribute('data-marker', id)
        elem.setAttribute('data-unbound', false)
        elem.appendChild(text)
        this.setMarkerStyles(elem)

        return elem
    }

    createMarkerId() {
        return rand()
    }

    addMarkerReferenceToChild(node, markerId) {
        for (let i = 0; i < node.children.length; i++) {
            if (node.children[i].nodeName === 'FIGURE' || node.children[i].classList.contains('spread__content')) {
                node.children[i].setAttribute('data-marker-reference-figure', markerId)
            }
        }
    }

    insertMarkers(doc, callback) {
        const nodes = doc.children

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i]
            const markerId = this.createMarkerId()
            let sibling

            if (this.shouldParse(node)) {
                if (this.isTarget(node)) {
                    sibling = this.getSibling(node)
                    if (sibling) {
                        const marker = this.createMarker(markerId)

                        // check to see if the marker we're injecting shares a
                        // parent with another marker. set a flag if so. this is
                        // referenced in Marker.jsx
                        if (sibling.lastElementChild && this.isMarker(sibling.lastElementChild)) {
                            marker.setAttribute('data-adjacent', true)
                        }

                        // inject into tree
                        sibling.appendChild(marker)
                        node.setAttribute('data-marker-reference', markerId)
                        this.addMarkerReferenceToChild(node, markerId)
                    } else {
                        // console.warn('No siblings or children could be found for', node.nodeName)

                        const elem = this.createMarker(markerId)
                        elem.setAttribute('data-unbound', true)
                        node.parentNode.prepend(elem)
                        node.setAttribute('data-marker-reference', markerId)
                        this.addMarkerReferenceToChild(node, markerId)

                        return
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

    addUltimateNode(doc) {
        const blacklist = [
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
        ]

        const text = document.createTextNode('')
        const elem = document.createElement('span')
        elem.setAttribute('class', 'ultimate')
        elem.appendChild(text)

        let child

        for (let i = doc.body.childNodes.length - 1; i >= 0; i--) {
            child = doc.body.childNodes[i]
            if (!blacklist.includes(child.nodeName) && child.nodeType === window.Node.ELEMENT_NODE) {
                child.appendChild(elem)
                return
            }
        }

        console.warn('Could not append ultimate node')
    }

    // check that all references have markers
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
            const markerData = typeof markerId !== 'undefined'
            console.assert(markerData, `Marker ${j} does not have a marker attribute`)

            const refExists = refHash[markerId]
            console.assert(refExists, `Reference for marker ${j} (${markerId}) could not be found`)

            if (!markerData) validMarkers = false
            if (!refExists) validRefs = false
        }

        return validLength && validMarkers && validRefs
    }

    parseXML(xmlString, callback) {
        const parser = new window.DOMParser()
        const doc = parser.parseFromString(xmlString, 'text/html')
        const { paddingLeft, columnGap } = this.settings
        let xml
        let err = null

        DocumentPreProcessor.setContextDocument(doc)
        DocumentPreProcessor.createStyleSheets({ paddingLeft, columnGap })
        DocumentPreProcessor.createScriptElements()
        DocumentPreProcessor.parseXML()

        this.insertMarkers(doc, nextDoc => {
            if (!this.validateDocument(nextDoc)) err = new Error('Invalid markup')
            this.addUltimateNode(doc)
            xml = xmlString.replace(/<body([^>]*?)>[\s\S]*<\/body>/g, `<body$1>${String(doc.body.innerHTML)}</body>`)
        })

        const result = { xml, doc }
        if (callback && typeof callback === 'function') {
            return callback(err, result)
        }

        return result
    }
}

export default DocumentProcessor
