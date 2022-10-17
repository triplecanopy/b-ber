import React, { useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import { connect } from 'react-redux'

function SidebarMetadata(props) {
  if (props.readerSettings.SidebarMetadata) {
    return props.readerSettings.SidebarMetadata(props)
  }

  if (props.showSidebar !== 'metadata') return null

  const node = useRef()

  const [maxHeight, setMaxHeight] = useState('0px')

  const updateMaxHeight = () => {
    const { y } = node.current.getBoundingClientRect()
    setMaxHeight(window.innerHeight - y)
  }

  useEffect(() => {
    updateMaxHeight()
  }, [node])

  useEffect(() => {
    window.addEventListener('resize', updateMaxHeight)

    return () => window.removeEventListener('resize', updateMaxHeight)
  }, [])

  return (
    <nav
      ref={node}
      style={{ maxHeight }}
      className={classNames(
        'bber-nav',
        'bber-controls__sidebar',
        'bber-controls__sidebar__metadata',
        'bber-controls__sidebar__metadata--open'
      )}
    >
      <dl className="bber-dl">
        {Object.entries(props.metadata).map(([key, value]) => {
          if (!key || !value) return null

          return (
            <div key={key}>
              <dt className="bber-dt">{key}</dt>
              <dd className="bber-dd">{value}</dd>
            </div>
          )
        })}
      </dl>
    </nav>
  )
}

export default connect(({ readerSettings }) => ({ readerSettings }))(
  SidebarMetadata
)
