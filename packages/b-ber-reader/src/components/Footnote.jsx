/* eslint-disable jsx-a11y/mouse-events-have-key-events */
/* eslint-disable jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Request, Asset, Url } from '../helpers'
import Viewport from '../helpers/Viewport'

const blacklistedNodeNames = ['SCRIPT', 'STYLE']

const isBlacklistedName = name => blacklistedNodeNames.includes(name)

const isBlacklistedNode = node => node.nodeType === window.Node.ELEMENT_NODE && isBlacklistedName(node.nodeName)

const processAnchorNode = node => {
    if (!node.href || Url.isRelative(node.href)) return node.parentNode.removeChild(node)

    const { origin } = new window.URL(node.href)

    return new RegExp(window.location.origin).test(origin)
        ? node.parentNode.removeChild(node) // Remove internal links
        : node.setAttribute('target', '_blank') // Ensure external links open in new page
}

const processFootnoteResponseElement = elem => {
    for (let i = elem.children.length - 1; i >= 0; i--) {
        const child = elem.children[i]

        // Remove any nodes that should not be injected into footnotes
        if (isBlacklistedNode(child)) child.parentNode.removeChild(child)

        if (child.nodeName === 'A') processAnchorNode(child)

        if (child.children.length) processFootnoteResponseElement(child)
    }

    return elem.innerHTML
}

class Footnote extends Component {
    static contextTypes = {
        viewerSettings: PropTypes.object,
        overlayElementId: PropTypes.string,
        registerOverlayElementId: PropTypes.func,
        deRegisterOverlayElementId: PropTypes.func,
    }

    constructor(props) {
        super(props)
        this.state = {
            footnoteBody: null,
            footnoteVisible: false,
        }
        this.getFootnote = this.getFootnote.bind(this)
        this.showFootnote = this.showFootnote.bind(this)
        this.hideFootnote = this.hideFootnote.bind(this)
        this.toggleFootnote = this.toggleFootnote.bind(this)
        this.handleOnMouseOver = this.handleOnMouseOver.bind(this)
        this.handleDocumentClick = this.handleDocumentClick.bind(this)

        this.overlayElementId = Asset.createId()
        this.footnoteElement = null
        this.footnoteContainer = null
    }
    componentWillReceiveProps(_, nextContext) {
        const { footnoteVisible } = this.state
        if (footnoteVisible && nextContext.overlayElementId !== this.overlayElementId) {
            this.setState({ footnoteVisible: false })
        } else if (!footnoteVisible && nextContext.overlayElementId === this.overlayElementId) {
            this.getFootnote().then(() => this.setState({ footnoteVisible: true }))
        }
    }
    componentWillUnmount() {
        document.addEventListener('click', this.handleDocumentClick)
    }
    getFootnote() {
        const { footnoteBody } = this.state
        if (footnoteBody) return Promise.resolve()

        const { hash } = new window.URL(this.props.href)
        const id = hash.slice(1)

        return Request.get(this.props.href).then(({ data }) => {
            const parser = new window.DOMParser()
            const doc = parser.parseFromString(data, 'text/html')
            const elem = doc.getElementById(id)

            if (!elem) {
                return console.error('Could not retrieve footnote %s; Document URL %s', hash, this.props.href)
            }

            this.setState({
                footnoteBody: processFootnoteResponseElement(elem),
            })
        })
    }
    handleOnMouseOver(e) {
        if (e) e.preventDefault()
        if (Viewport.isMobile()) return
        this.toggleFootnote()
    }
    handleDocumentClick(e) {
        if (e.target.nodeName === 'A') return
        this.hideFootnote()
    }
    toggleFootnote(e) {
        if (e) e.preventDefault()
        return this.state.footnoteVisible ? this.hideFootnote() : this.showFootnote()
    }
    showFootnote(e) {
        if (e) e.preventDefault()
        this.context.registerOverlayElementId(this.overlayElementId)
        document.addEventListener('click', this.handleDocumentClick)
    }
    hideFootnote(e) {
        if (e) e.preventDefault()
        this.context.deRegisterOverlayElementId()
    }
    getFootnoteOffset() {
        if (!this.footnoteContainer || !this.footnoteElement) {
            console.warn('Footnote elements are not bound')
            return false
        }

        const { top } = this.footnoteContainer.getBoundingClientRect()
        const { paddingTop, paddingBottom } = this.context.viewerSettings
        const height = this.footnoteElement.offsetHeight
        const windowHeight = window.innerHeight

        return top + height > windowHeight - (paddingTop + paddingBottom)
    }
    footnoteStyles() {
        const { columnWidth, columnGap, paddingLeft } = this.context.viewerSettings
        const aboveElement = this.getFootnoteOffset()
        const offsetProp = aboveElement ? 'bottom' : 'top'
        const left = 0
        const width = Viewport.isMobile() ? window.innerWidth - paddingLeft * 2 : `${columnWidth + columnGap}px`

        const styles = { width, left, [offsetProp]: '1.5rem' }

        // Return default styles if no node exists
        if (!this.footnoteContainer) return styles

        // Set position left for footnote
        styles.left = this.footnoteContainer.getBoundingClientRect().x

        // Adjust position based on verso or recto position of footnote reference
        styles.left =
            styles.left >= window.innerWidth / 2
                ? (styles.left = styles.left * -1 + paddingLeft + columnWidth + columnGap)
                : (styles.left = styles.left * -1 + paddingLeft)

        return styles
    }

    render() {
        const { footnoteBody, footnoteVisible } = this.state
        return (
            <span
                ref={node => (this.footnoteContainer = node)}
                className="footnote__container"
                style={{ display: 'inline', position: 'relative' }}
            >
                <a href={this.props.href} onMouseOver={this.handleOnMouseOver} onClick={this.toggleFootnote}>
                    {this.props.children}
                </a>
                <span
                    ref={node => (this.footnoteElement = node)}
                    className={classNames('footnote__body', {
                        'footnote__body--hidden': !footnoteBody || !footnoteVisible,
                    })}
                    style={this.footnoteStyles()}
                >
                    <span className="footnote__content" dangerouslySetInnerHTML={{ __html: footnoteBody }} />
                </span>
            </span>
        )
    }
}

export default Footnote
