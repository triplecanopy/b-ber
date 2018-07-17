/* eslint-disable jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Request, Asset, Url} from '../helpers'

const footnoteStyles = maxWidth => ({
    display: 'block',
    background: 'white',
    position: 'absolute',
    width: `${maxWidth}px`,
    fontSize: '14px',
    lineHeight: '1.6',
    zIndex: '1000',
})

const blacklistedElementNames = [
    'SCRIPT',
    'STYLE',
]

const isBlacklisted = nodeName => blacklistedElementNames.indexOf(nodeName) > -1

const processFootnoteResponseElement = elem => {
    for (let i = elem.children.length - 1; i >= 0; i--) {
        const child = elem.children[i]
        if (child.nodeType === window.Node.ELEMENT_NODE && isBlacklisted(child.nodeName)) {
            child.parentNode.removeChild(child)
        }
        if (child.nodeName === 'A') {
            if (!child.href || Url.isRelativeURL(child.href)) {
                child.parentNode.removeChild(child)
            }
            else {
                const {origin} = new window.URL(child.href)
                if (new RegExp(window.location.origin).test(origin)) {
                    child.parentNode.removeChild(child) // remove internal links
                }
                else {
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
        overlayElementId: PropTypes.string,
        registerOverlayElementId: PropTypes.func,
        deRegisterOverlayElementId: PropTypes.func,
    }

    constructor(props) {
        super(props)
        this.state = {footnoteBody: null, footnoteVisible: false}
        this.getFootnote = this.getFootnote.bind(this)
        this.showFootnote = this.showFootnote.bind(this)
        this.hideFootnote = this.hideFootnote.bind(this)

        this.overlayElementId = Asset.createId()
    }
    componentWillReceiveProps(_, nextContext) {
        const {footnoteVisible} = this.state
        if (footnoteVisible && nextContext.overlayElementId !== this.overlayElementId) {
            this.setState({footnoteVisible: false})
        }
        else if (!footnoteVisible && nextContext.overlayElementId === this.overlayElementId) {
            this.getFootnote().then(_ => this.setState({footnoteVisible: true}))
        }
    }
    getFootnote() {
        const {footnoteBody} = this.state
        if (footnoteBody) return Promise.resolve()

        const {hash} = new window.URL(this.props.href)
        const id = hash.slice(1)

        return Request.get(this.props.href).then(({data}) => {
            const parser = new window.DOMParser()
            const doc = parser.parseFromString(data, 'text/html')
            const elem = doc.getElementById(id)

            if (!elem) return console.error(`Could not retrieve footnote %s; Document URL %s`, hash, this.props.href)
            const footnoteBody = processFootnoteResponseElement(elem)

            this.setState({footnoteBody})
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
    render() {
        const {footnoteBody, footnoteVisible} = this.state
        return (
            <span
                style={{display: 'inline', position: 'relative'}}
                className='footnote__container'
            >
                <a
                    href={this.props.href}
                    onMouseOver={this.showFootnote}
                    onFocus={this.showFootnote}
                >{this.props.children}
                </a>
                {footnoteBody && footnoteVisible ?
                    <span
                        className='footnote__body'
                        style={footnoteStyles((window.innerWidth / 23) * 9)} // TODO: column width
                        onMouseOut={this.hideFootnote}
                        onBlur={this.hideFootnote}
                    >
                        <span className='footnote__content' dangerouslySetInnerHTML={{__html: footnoteBody}} />
                    </span> :
                    null
                }
            </span>
        )
    }
}


export default Footnote
