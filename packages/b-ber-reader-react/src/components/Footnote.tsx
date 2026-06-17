import classNames from 'classnames'
import React, { useEffect, useRef, useState } from 'react'
import Asset from '../helpers/Asset'
import Request from '../helpers/Request'
import Url from '../helpers/Url'
import Viewport from '../helpers/Viewport'
import { useStore } from '../store/StoreContext'

const blacklistedNodeNames = ['SCRIPT', 'STYLE']

const isBlacklistedName = (name: string) => blacklistedNodeNames.includes(name)

const isBlacklistedNode = (node: Node) =>
  node.nodeType === window.Node.ELEMENT_NODE && isBlacklistedName(node.nodeName)

const processAnchorNode = (node: HTMLAnchorElement) => {
  if (!node.href || Url.isRelative(node.href)) {
    return node.parentNode?.removeChild(node)
  }

  const { origin } = new window.URL(node.href)

  return new RegExp(window.location.origin).test(origin)
    ? node.parentNode?.removeChild(node) // Remove internal links
    : node.setAttribute('target', '_blank') // Ensure external links open in new page
}

const processFootnoteResponseElement = (
  node: Element,
  count?: number
): string => {
  for (let i = node.children.length - 1; i >= 0; i--) {
    const child = node.children[i]

    // Remove any nodes that should not be injected into footnotes
    if (isBlacklistedNode(child)) child.parentNode?.removeChild(child)

    if (child.nodeName === 'A') processAnchorNode(child as HTMLAnchorElement)

    if (child.children.length) processFootnoteResponseElement(child)
  }

  if (typeof count !== 'undefined') {
    const countNode = document.createElement('span')
    const countText = document.createTextNode(String(count))

    countNode.classList.add('footnote__content--count')
    countNode.appendChild(countText)
    node.prepend(countNode)
  }

  return node.innerHTML
}

interface FootnoteProps {
  id?: string
  href: string
  children?: React.ReactNode
}

function Footnote({ id, href, children }: FootnoteProps) {
  // viewerSettings is read from the built-in store (TASK-106).
  const viewerSettings = useStore((s) => s.viewerSettings)
  const [content, setContent] = useState('')
  const [visible, setVisible] = useState(false)
  const [footnoteId] = useState(() => Asset.createId())

  const footnoteContainer = useRef<HTMLSpanElement>(null)
  const footnoteElement = useRef<HTMLSpanElement>(null)

  // Tracks the listeners currently bound by showFootnote, so hideFootnote and
  // unmount can remove the exact same function references.
  const boundListeners = useRef<{
    click?: (e: MouseEvent) => void
    mousemove?: (e: MouseEvent) => void
  }>({})

  // Unbind hideFootnote handler in case unmounting while footnote is visible
  useEffect(
    () => () => {
      if (boundListeners.current.click) {
        document.removeEventListener('click', boundListeners.current.click)
      }
    },
    []
  )

  const getFootnote = async () => {
    if (content) return

    const { hash } = new window.URL(href)
    const noteId = hash.slice(1)

    const { data } = await Request.getText(href)
    const parser = new window.DOMParser()
    const doc = parser.parseFromString(data, 'text/html')
    const elem = doc.getElementById(noteId)

    if (!elem) {
      console.error(
        'Could not retrieve footnote %s; Document URL %s',
        hash,
        href
      )
      return
    }

    // Get the rendered number of the footnote to place in the footnote body
    let parent = elem.parentNode
    while (parent && parent.nodeName !== 'UL' && parent.nodeName !== 'OL') {
      parent = parent.parentNode
    }

    let count: number | undefined
    if (parent) {
      const start = Number((parent as Element).getAttribute('start')) || 1
      const index = Array.prototype.indexOf.call(
        (parent as Element).children,
        elem
      )

      count = start + index
    }

    // Don't need to pass in the list element, so only pass in its children.
    // Also used to inject the `count` element into the footnote body
    setContent(
      processFootnoteResponseElement(elem.firstChild as Element, count)
    )
  }

  const hideFootnote = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()

    setVisible(false)

    if (boundListeners.current.click) {
      document.removeEventListener('click', boundListeners.current.click)
    }
    if (boundListeners.current.mousemove) {
      document.removeEventListener(
        'mousemove',
        boundListeners.current.mousemove
      )
    }
    boundListeners.current = {}
  }

  const handleOnMouseOver = (e?: React.MouseEvent) => {
    if (e) e.preventDefault()
    if (Viewport.isSingleColumn()) return
    toggleFootnote()
  }

  // Hide footnote if user hovers over a different note
  const handleOnMouseMove = (e: MouseEvent) => {
    if (Viewport.isSingleColumn()) return

    const target = e.target as HTMLElement
    if (
      target.nodeName === 'SPAN' &&
      target.classList.contains('footnote__number') &&
      target.dataset.footnote !== footnoteId
    ) {
      hideFootnote()
    }
  }

  const handleDocumentClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).nodeName === 'A') return
    hideFootnote()
  }

  const toggleFootnote = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    return visible ? hideFootnote() : showFootnote()
  }

  const showFootnote = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault()

    await getFootnote()
    setVisible(true)

    document.addEventListener('click', handleDocumentClick) // Bind hideFootnote handler
    document.addEventListener('mousemove', handleOnMouseMove)
    boundListeners.current = {
      click: handleDocumentClick,
      mousemove: handleOnMouseMove,
    }
  }

  const getFootnoteOffset = () => {
    if (!footnoteContainer.current || !footnoteElement.current) {
      console.warn('Footnote elements are not bound')
      return false
    }

    const { top } = footnoteContainer.current.getBoundingClientRect()
    const { paddingTop, paddingBottom } = viewerSettings
    const height = footnoteElement.current.offsetHeight
    const windowHeight = window.innerHeight

    return top + height > windowHeight - (paddingTop + paddingBottom)
  }

  const footnoteStyles = (): React.CSSProperties => {
    const { columnWidth, columnGap, paddingLeft } = viewerSettings
    const isSingleColumn = Viewport.isSingleColumn()
    const aboveElement = getFootnoteOffset()
    const offsetProp = aboveElement ? 'bottom' : 'top'
    const offset = offsetProp === 'bottom' ? '1rem' : '1.5rem'
    const left = 0
    const width = isSingleColumn
      ? window.innerWidth - paddingLeft * 2
      : `${columnWidth + columnGap}px`

    const styles: React.CSSProperties = { width, left, [offsetProp]: offset }

    // Return default styles if no node exists
    if (!footnoteContainer.current) return styles

    // Set position left for footnote
    styles.left = footnoteContainer.current.getBoundingClientRect().x

    // Adjust position based on verso or recto position of footnote reference
    styles.left = isSingleColumn
      ? (styles.left = (styles.left as number) * -1 + paddingLeft)
      : (styles.left as number) >= window.innerWidth / 2
        ? (styles.left =
            (styles.left as number) * -1 +
            paddingLeft +
            columnWidth +
            columnGap)
        : (styles.left = (styles.left as number) * -1 + paddingLeft)

    styles.cursor = 'auto'

    return styles
  }

  const hidden = !content || !visible
  const footnoteContainerStyles: React.CSSProperties = {
    display: 'inline',
    position: 'relative',
  }

  return (
    <span id={id} className="footnote-ref">
      <span
        ref={footnoteContainer}
        className="footnote__container"
        style={footnoteContainerStyles}
      >
        {/* biome-ignore lint/a11y/noStaticElementInteractions: footnote toggle is a legacy interaction pattern */}
        {/* biome-ignore lint/a11y/noNoninteractiveElementInteractions: footnote toggle is a legacy interaction pattern */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: footnote toggle is a legacy interaction pattern */}
        {/* biome-ignore lint/a11y/useKeyWithMouseEvents: footnote toggle is a legacy interaction pattern */}
        <span
          className="footnote__number"
          data-footnote={footnoteId}
          onClick={toggleFootnote}
          onMouseOver={handleOnMouseOver}
        >
          {children}
        </span>
        <span
          ref={footnoteElement}
          style={footnoteStyles()}
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

export default Footnote
