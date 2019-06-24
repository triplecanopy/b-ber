/* eslint-disable jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Request, Asset, Url } from '../helpers'

const blacklistedNodeNames = ['SCRIPT', 'STYLE']

const isBlacklisted = nodeName => blacklistedNodeNames.includes(nodeName)

const processFootnoteResponseElement = elem => {
    for (let i = elem.children.length - 1; i >= 0; i--) {
        const child = elem.children[i]
        if (child.nodeType === window.Node.ELEMENT_NODE && isBlacklisted(child.nodeName)) {
            child.parentNode.removeChild(child)
        }
        if (child.nodeName === 'A') {
            if (!child.href || Url.isRelative(child.href)) {
                child.parentNode.removeChild(child)
            } else {
                const { origin } = new window.URL(child.href)
                if (new RegExp(window.location.origin).test(origin)) {
                    child.parentNode.removeChild(child) // remove internal links
                } else {
                    child.setAttribute('target', '_blank') // ensure external links open in new page
                }
            }
        }

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
    getFootnote() {
        console.log('getting')
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
    showFootnote(e) {
        e.preventDefault()
        this.context.registerOverlayElementId(this.overlayElementId)
    }
    hideFootnote(e) {
        e.preventDefault()
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

        // set position left for footnote
        let left = 0
        if (this.footnoteContainer) {
            left = this.footnoteContainer.getBoundingClientRect().x

            // adjust position based on verso or recto position of footnote reference
            if (left >= window.innerWidth / 2) {
                left = left * -1 + paddingLeft + columnWidth + columnGap
            } else {
                left = left * -1 + paddingLeft
            }
        }

        return {
            background: 'white',
            position: 'absolute',
            width: `${columnWidth + columnGap}px`,
            fontSize: '14px',
            lineHeight: 1.6,
            zIndex: 1000,
            [offsetProp]: '1.5rem',
            paddingLeft: '1.5em',
            paddingRight: '1.5em',
            left,
        }
    }

    render() {
        const { footnoteBody, footnoteVisible } = this.state
        return (
            <span
                ref={node => (this.footnoteContainer = node)}
                className="footnote__container"
                style={{ display: 'inline', position: 'relative' }}
            >
                <a
                    href={this.props.href}
                    onMouseOver={this.showFootnote}
                    onFocus={this.showFootnote}
                    onClick={e => e.preventDefault()}
                >
                    {this.props.children}
                </a>

                <span
                    ref={node => (this.footnoteElement = node)}
                    className={classNames('footnote__body', {
                        'footnote__body--hidden': !footnoteBody || !footnoteVisible,
                    })}
                    style={this.footnoteStyles()}
                    onMouseOut={this.hideFootnote}
                    onBlur={this.hideFootnote}
                >
                    <span className="footnote__content" dangerouslySetInnerHTML={{ __html: footnoteBody }} />
                </span>
            </span>
        )
    }
}

export default Footnote
