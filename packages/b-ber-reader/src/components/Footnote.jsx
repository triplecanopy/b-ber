import React from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { Request, Asset, Url } from '../helpers'
import Viewport from '../helpers/Viewport'

const blacklistedNodeNames = ['SCRIPT', 'STYLE']

const isBlacklistedName = name => blacklistedNodeNames.includes(name)

const isBlacklistedNode = node =>
  node.nodeType === window.Node.ELEMENT_NODE && isBlacklistedName(node.nodeName)

const processAnchorNode = node => {
  if (!node.href || Url.isRelative(node.href)) {
    return node.parentNode.removeChild(node)
  }

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

class Footnote extends React.Component {
  footnoteContainer = React.createRef()
  footnoteElement = React.createRef()

  state = {
    content: '',
    visible: false,
    footnote: Asset.createId(),
  }

  // Unbind hideFootnote handler in case unmounting while footnote is visible
  componentWillUnmount() {
    document.removeEventListener('click', this.handleDocumentClick)
  }

  getFootnote = async () => {
    let { content } = this.state
    if (content) return

    const { hash } = new window.URL(this.props.href)
    const id = hash.slice(1)

    const { data } = await Request.get(this.props.href)
    const parser = new window.DOMParser()
    const doc = parser.parseFromString(data, 'text/html')
    const elem = doc.getElementById(id)

    if (!elem) {
      console.error(
        'Could not retrieve footnote %s; Document URL %s',
        hash,
        this.props.href
      )
      return
    }

    content = processFootnoteResponseElement(elem)

    this.setState({ content })
  }

  handleOnMouseOver = e => {
    if (e) e.preventDefault()
    if (Viewport.isMobile()) return
    this.toggleFootnote()
  }

  // Hide footnote if user hovers over a different note
  handleOnMouseMove = e => {
    if (Viewport.isMobile()) return

    if (
      e.target.nodeName === 'SPAN' &&
      e.target.classList.contains('footnote__number') &&
      e.target.dataset.footnote !== this.state.footnote
    ) {
      this.hideFootnote()
    }
  }

  handleDocumentClick = e => {
    if (e.target.nodeName === 'A') return
    this.hideFootnote()
  }

  toggleFootnote = e => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    return this.state.visible ? this.hideFootnote() : this.showFootnote()
  }

  showFootnote = async e => {
    if (e) e.preventDefault()

    await this.getFootnote()
    this.setState({ visible: true })

    document.addEventListener('click', this.handleDocumentClick) // Bind hideFootnote handler
    document.addEventListener('mousemove', this.handleOnMouseMove)
  }

  hideFootnote = e => {
    if (e) e.preventDefault()

    this.setState({ visible: false })

    document.removeEventListener('click', this.handleDocumentClick) // Unbind hideFootnote handler
    document.removeEventListener('mousemove', this.handleOnMouseMove)
  }

  getFootnoteOffset() {
    if (!this.footnoteContainer?.current || !this.footnoteElement?.current) {
      console.warn('Footnote elements are not bound')
      return false
    }

    const { top } = this.footnoteContainer.current.getBoundingClientRect()
    const { paddingTop, paddingBottom } = this.props.viewerSettings
    const height = this.footnoteElement.current.offsetHeight
    const windowHeight = window.innerHeight

    return top + height > windowHeight - (paddingTop + paddingBottom)
  }

  footnoteStyles() {
    const { columnWidth, columnGap, paddingLeft } = this.props.viewerSettings
    const isMobile = Viewport.isMobile()
    const aboveElement = this.getFootnoteOffset()
    const offsetProp = aboveElement ? 'bottom' : 'top'
    const offset = offsetProp === 'bottom' ? '1rem' : '1.5rem'
    const left = 0
    const width = isMobile
      ? window.innerWidth - paddingLeft * 2
      : `${columnWidth + columnGap}px`

    const styles = { width, left, [offsetProp]: offset }

    // Return default styles if no node exists
    if (!this.footnoteContainer?.current) return styles

    // Set position left for footnote
    styles.left = this.footnoteContainer.current.getBoundingClientRect().x

    // Adjust position based on verso or recto position of footnote reference
    styles.left = isMobile
      ? (styles.left = styles.left * -1 + paddingLeft)
      : styles.left >= window.innerWidth / 2
      ? (styles.left = styles.left * -1 + paddingLeft + columnWidth + columnGap)
      : (styles.left = styles.left * -1 + paddingLeft)

    styles.cursor = 'auto'

    return styles
  }

  render() {
    const { content, visible } = this.state
    const hidden = !content || !visible
    const footnoteContainerStyles = { display: 'inline', position: 'relative' }

    return (
      <span id={this.props.id} className="footnote-ref">
        <span
          ref={this.footnoteContainer}
          className="footnote__container"
          style={footnoteContainerStyles}
        >
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/mouse-events-have-key-events */}
          <span
            className="footnote__number"
            data-footnote={this.state.footnote}
            onClick={this.toggleFootnote}
            onMouseOver={this.handleOnMouseOver}
          >
            {this.props.children}
          </span>
          <span
            ref={this.footnoteElement}
            style={this.footnoteStyles()}
            className={classNames('footnote__body', {
              'footnote__body--hidden': hidden,
            })}
          >
            <span
              className="footnote__content"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </span>
        </span>
      </span>
    )
  }
}

export default connect(
  ({ viewerSettings }) => ({ viewerSettings }),
  () => ({})
)(Footnote)
