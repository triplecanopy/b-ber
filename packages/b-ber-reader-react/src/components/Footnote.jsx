import React from 'react'
import { connect } from 'react-redux'
import classNames from 'classnames'
import Request from '../helpers/Request'
import Asset from '../helpers/Asset'
import Url from '../helpers/Url'
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

const processFootnoteResponseElement = (node, count) => {
  for (let i = node.children.length - 1; i >= 0; i--) {
    const child = node.children[i]

    // Remove any nodes that should not be injected into footnotes
    if (isBlacklistedNode(child)) child.parentNode.removeChild(child)

    if (child.nodeName === 'A') processAnchorNode(child)

    if (child.children.length) processFootnoteResponseElement(child)
  }

  if (typeof count !== 'undefined') {
    const countNode = document.createElement('span')
    const countText = document.createTextNode(count)

    countNode.classList.add('footnote__content--count')
    countNode.appendChild(countText)
    node.prepend(countNode)
  }

  return node.innerHTML
}

class Footnote extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      content: '',
      visible: false,
      footnote: Asset.createId(),
    }
  }

  footnoteContainer = React.createRef()

  footnoteElement = React.createRef()

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

    // Get the rendered number of the footnote to place in the footnote body
    let parent = elem.parentNode
    while (parent && parent.nodeName !== 'UL' && parent.nodeName !== 'OL') {
      parent = parent.parentNode
    }

    let count
    if (parent) {
      const start = Number(parent.getAttribute('start')) || 1
      const index = Array.prototype.indexOf.call(parent.children, elem)

      count = start + index
    }

    // Don't need to pass in the list element, so only pass in its children.
    // Also used to inject the `count` element into the footnote body
    content = processFootnoteResponseElement(elem.firstChild, count)

    this.setState({ content })
  }

  handleOnMouseOver = e => {
    if (e) e.preventDefault()
    if (Viewport.isSingleColumn()) return
    this.toggleFootnote()
  }

  // Hide footnote if user hovers over a different note
  handleOnMouseMove = e => {
    if (Viewport.isSingleColumn()) return

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
    const isSingleColumn = Viewport.isSingleColumn()
    const aboveElement = this.getFootnoteOffset()
    const offsetProp = aboveElement ? 'bottom' : 'top'
    const offset = offsetProp === 'bottom' ? '1rem' : '1.5rem'
    const left = 0
    const width = isSingleColumn
      ? window.innerWidth - paddingLeft * 2
      : `${columnWidth + columnGap}px`

    const styles = { width, left, [offsetProp]: offset }

    // Return default styles if no node exists
    if (!this.footnoteContainer?.current) return styles

    // Set position left for footnote
    styles.left = this.footnoteContainer.current.getBoundingClientRect().x

    // Adjust position based on verso or recto position of footnote reference
    styles.left = isSingleColumn
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
